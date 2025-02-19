import { useOperation } from "../../(hooks)/useOperation"
import React, { FC, useMemo } from 'react'
import { useApplicationStore } from "../../(stores)/applicationStore"
import { Loading } from "../../(components)/Loading"
import { Text, Box } from 'ink'
import { Error } from "../../(components)/Error"
import { Err } from "@thinairthings/utilities"

export const CreateUniqueIndex: FC<{
    nodeType: Capitalize<string>,
    propertyName: string
}> = ({
    nodeType,
    propertyName
}) => {
        const neo4jDriver = useApplicationStore(store => store.neo4jDriver)
        useOperation({
            dependencies: [neo4jDriver],
            operationKey: `createUniqueIndex-${nodeType}-${propertyName}`,
            tryOp: async ([neo4jDriver]) => {
                await neo4jDriver.executeQuery(/*cypher*/`
                CREATE CONSTRAINT ${nodeType}_${propertyName}_index IF NOT EXISTS
                FOR (node:${nodeType})
                REQUIRE node.${propertyName} IS UNIQUE
            `)
                return true
            },
            catchOp: (error: Error) => Err({
                type: 'ThinAirCLIError',
                subtype: 'Neo4jError',
                message: `Failed to create unique constraint for ${nodeType}.${propertyName}: ${error.message}`,
                data: {
                    neo4jErrorType: error.name,
                    nodeType: nodeType,
                    propertyName
                }
            }),
            render: {
                Success: ({ data }) => <Text>✅ Successfully created unique index for {nodeType}Node on property {propertyName}</Text>,
                Pending: () => <Loading text={`Creating unique index for ${nodeType}`} />,
                Error: ({ error }) => (
                    <Error
                        message={`Unique index creation failed for: ${error.data?.nodeType}Node`}
                        isBugReport={true}
                        error={error}
                    />
                )
            },
        })
        // This signals a leaf
        return <></>
    }