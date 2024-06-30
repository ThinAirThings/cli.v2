
import React, { FC } from 'react';
import { ReactQueryProvider } from './ReactQueryProvider';
import dotenv from 'dotenv'
import { Box, Text } from 'ink';
import { useOperation } from '../(hooks)/useOperation';
import { require as tsxRequire } from 'tsx/cjs/api'
import { GenericUixConfig } from '@thinairthings/uix';
import { applicationStore } from '../(stores)/applicationStore';
import { Loading } from './Loading';
import { tsImport } from 'tsx/esm/api'
import { Err } from "@thinairthings/utilities"
export const CommandEnvironment: FC<{
    pathToConfig: string
    Command: FC<any>
}> = ({
    pathToConfig,
    Command
}) => {
        return (
            <Box>
                <ReactQueryProvider
                    CommandEnvironment={() => {
                        // Get config
                        const result = useOperation({
                            dependencies: [],
                            operationKey: 'uixConfig',
                            tryOp: async () => {
                                const {
                                    default: config
                                } = await tsImport(pathToConfig, {
                                    parentURL: import.meta.url,
                                    tsconfig: false
                                }) as {
                                    default: GenericUixConfig
                                }
                                console.log("BELOW REQUIRE")
                                dotenv.config({ path: config.envPath })
                                applicationStore.setState(({ uixConfig: config }))
                                return config
                            },
                            catchOp: (error: Error) => Err({
                                type: 'Thinair CLI Error',
                                subtype: 'UixConfigNotFound',
                                message: `Uix config not found: ${error.message}`,
                                data: { pathToConfig: pathToConfig }
                            }),
                            render: {
                                Success: ({ data }) => <Text>✅ Uix config found @ {data.pathToConfig}</Text>,
                                Pending: () => <Loading text="Finding config..." />,
                                Error: ({ error }) => <Text color="red">Error finding config file: {error.message}</Text>
                            }
                        })
                        if (!result) return <Loading text="Finding config..." />
                        return <Command />
                    }}
                />
            </Box>
        )
    }