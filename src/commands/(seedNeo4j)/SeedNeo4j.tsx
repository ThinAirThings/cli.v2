import React, { useMemo } from 'react';
import { Text } from 'ink';
import { Loading } from '../../(components)/Loading';
import { useOperation } from '../../(hooks)/useOperation';
import { useApplicationStore } from '../../(stores)/applicationStore';
import { CreateUniqueIndex } from './CreateUniqueIndex';
import { CreatePropertyVector } from './CreatePropertyVector';
import { CreateNodeTypeVector } from './CreateNodeTypeVector';
import { Neo4jError } from 'neo4j-driver';
import { Err } from '@thinairthings/utilities';

export const SeedNeo4j = () => {
    const uixConfig = useApplicationStore(state => state.uixConfig)
    const neo4jDriver = useApplicationStore(state => state.neo4jDriver)
    useOperation({
        dependencies: [uixConfig, neo4jDriver] as const,
        operationKey: 'createNullNode',
        tryOp: async ([uixConfig, neo4jDriver]) => {
            // Create Null Node
            uixConfig.graph.nodeTypeMap['Null']
                || uixConfig.graph.nodeTypeMap['Root']
                && await neo4jDriver.executeQuery(/*cypher*/`
                    merge (nullNode:Node:Null {nodeId: '0'})
                    on create set nullNode.createdAt = datetime()
                    with nullNode
                    where not 'Root' IN labels(nullNode)
                    set nullNode:Root
                    return nullNode
            `)
            // Add timestamp indexes for sorting
            await neo4jDriver.executeQuery(/*cypher*/`
                CREATE INDEX node_created_at IF NOT EXISTS FOR (node:Node) ON (node.createdAt);
            `)
            await neo4jDriver.executeQuery(/*cypher*/`
                CREATE INDEX node_updated_at IF NOT EXISTS FOR (node:Node) ON (node.updatedAt);
            `)
            // Add MATCH_TO unique type contraint
            await neo4jDriver.executeQuery(/*cypher*/`
                CREATE CONSTRAINT match_to_unique IF NOT EXISTS 
                FOR ()-[match_to:MATCH_TO]-() 
                REQUIRE (match_to.fromNodeId, match_to.type, match_to.toNodeId) IS UNIQUE;
            `)
            return true
        },
        catchOp: (error: Neo4jError) => Err({
            type: 'ThinAirCLIError',
            subtype: 'Neo4jError',
            message: `Failed to create Null node: ${error.message}`,
            data: error
        }),
        render: {
            Success: () => <Text>✅ Null node created.</Text>,
            Pending: () => <Loading text="Creating null node..." />,
            Error: ({ error }) => <Text color="red">Error creating null node: {error.data?.message}</Text>
        }
    })
    if (!uixConfig) return <></>
    return (<>
        {uixConfig.graph.nodeTypeSet.map(NodeType =>
            NodeType.matchToRelationshipTypeSet
            && <CreateNodeTypeVector
                key={NodeType.type}
                nodeType={NodeType.type}
            />
        )}
        {uixConfig.graph.nodeTypeSet.map(NodeType =>
            NodeType.uniqueIndexes.map(uniqueIndex =>
                <CreateUniqueIndex
                    key={`${NodeType.type}-${uniqueIndex}`}
                    nodeType={NodeType.type}
                    propertyName={uniqueIndex}
                />
            )
        )}
        {uixConfig.graph.nodeTypeSet.map(NodeType =>
            NodeType.propertyVectors.map(propertyVector =>
                <CreatePropertyVector
                    key={`${NodeType.type}-${propertyVector}`}
                    nodeType={NodeType.type}
                    propertyName={propertyVector}
                />
            )
        )}
    </>)
}