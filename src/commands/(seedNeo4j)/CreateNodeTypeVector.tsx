import { useOperation } from "../../(hooks)/useOperation"
import React, { FC, useMemo } from 'react'
import { useApplicationStore } from "../../(stores)/applicationStore"
import { Loading } from "../../(components)/Loading"
import { Neo4jError } from "neo4j-driver"
import { Error } from "../../(components)/Error"
import { Success } from "../../(components)/Success"
import { Err } from "@thinairthings/utilities"

export const CreateNodeTypeVector: FC<{
    nodeType: Capitalize<string>,
}> = ({
    nodeType,
}) => {
        const neo4jDriver = useApplicationStore(store => store.neo4jDriver)
        const createNodeTypeVectorResult = useOperation({
            dependencies: [neo4jDriver],
            operationKey: `createNodeTypeVector-${nodeType}`,
            tryOp: async ([neo4jDriver]) => {
                await neo4jDriver.executeQuery(/*cypher*/`
                    CREATE VECTOR INDEX ${nodeType}_vector IF NOT EXISTS
                    FOR (vectorNode:${nodeType}Vector)
                    ON (vectorNode.nodeTypeEmbedding)
                    OPTIONS {indexConfig: {
                        \`vector.dimensions\`: 3072,
                        \`vector.similarity_function\`: "cosine"
                    }}
                `)
                return true
            },
            catchOp: (error: Neo4jError) => {
                return Err({
                    type: 'ThinAirCLIError',
                    subtype: 'Neo4jError',
                    message: `Failed to create NodeType vector for ${nodeType}: ${error.message}`,
                    data: {
                        neo4jErrorType: error.name,
                        nodeType: nodeType,
                    }
                })
            },
            render: {
                Success: () => <Success message={`Successfully created NodeType vector for ${nodeType}Node`} />,
                Pending: () => <Loading text={`Creating NodeType vector for ${nodeType}`} />,
                Error: ({ error }) => (
                    <Error
                        message={`NodeType vector creation failed for: ${nodeType}Node`}
                        isBugReport={true}
                        error={error}
                    />
                )
            },
        })
        return <></>
    }