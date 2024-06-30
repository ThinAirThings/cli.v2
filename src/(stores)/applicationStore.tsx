import { createImmerState } from "../(utilities)/createImmerState";
import React, { FC } from 'react'
import { GenericUixConfig } from "@thinairthings/uix"
import { Driver } from "neo4j-driver";
import { Box, Newline, Text } from "ink";
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import { createNeo4jClient } from "../(clients)/neo4j";

export const applicationStore = createImmerState({
    outputMap: new Map<string, {
        Component: FC,
        operationState: 'pending' | 'success' | 'error',
    }>([['header', {
        Component: () => (
            <Box flexDirection="column">
                <Gradient name='rainbow'>
                    <BigText text='Uix' font='3d' />
                </Gradient>
                <Text>Uix Graph System 🔥 by 🐰 Thin Air </Text>
                <Newline />
            </Box>
        ),
        operationState: 'success'
    }]]),
    uixConfig: null as GenericUixConfig | null,
    complete: false as boolean,
    neo4jDriver: null as Driver | null,
})

applicationStore.subscribe(
    state => state.uixConfig,
    async uixConfig => {
        if (!uixConfig) return
        const neo4jDriver = createNeo4jClient({
            uri: process.env.NEO4J_URI!,
            username: process.env.NEO4J_USERNAME!,
            password: process.env.NEO4J_PASSWORD!,
        }, {
            connectionTimeout: 3000,
        })
        applicationStore.setState({
            neo4jDriver: neo4jDriver
        })
    }
)
// Close the neo4j driver when all operations are successful
applicationStore.subscribe(
    state => state.outputMap,
    async outputMap => {
        applicationStore.setState(state => {
            state.complete = [...outputMap].every(([_, { operationState }]) => operationState === 'success' || operationState === 'error')
        })
        if (![...outputMap].every(([_, { operationState }]) => operationState === 'success' || operationState === 'error')) return
        await applicationStore.getState().neo4jDriver?.close()
    }
)

export const useApplicationStore = <R,>(
    selector: (state: ReturnType<typeof applicationStore.getState>) => R
) => applicationStore(selector)