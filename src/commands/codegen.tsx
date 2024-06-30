
import React, { FC, Fragment, useEffect, useState } from 'react';
import { Text, Box, Newline, useStdin, useApp, Static } from 'ink';
import { z, TypeOf } from 'zod';
import { Loading } from '../(components)/Loading';
import { CommandEnvironment } from '../(components)/CommandEnvironment';
import { GenericUixConfig } from '@thinairthings/uix';
import { require as tsxRequire } from 'tsx/cjs/api'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { SeedNeo4j } from './(seedNeo4j)/SeedNeo4j';
import { applicationStore, useApplicationStore } from '../(stores)/applicationStore';
import { useOperation } from '../(hooks)/useOperation';
import { functionModuleTemplate } from './(templates)/functionModuleTemplate';
import { queryOptionsTemplate } from './(templates)/queryOptions/queryOptionsTemplate';
import { staticObjectsTemplate } from './(templates)/staticObjectsTemplate';
import { useUniqueChildTemplate } from './(templates)/hooks/useUniqueChildTemplate';
import { useNodeKeyTemplate } from './(templates)/hooks/useNodeKeyTemplate';
import { useNodeSetTemplate } from './(templates)/hooks/useNodeSetTemplate';
import { useNodeIndexTemplate } from './(templates)/hooks/useNodeIndexTemplate';
import { useNodeTypeTemplate } from './(templates)/hooks/useNodeTypeTemplate';
import { Err } from '@thinairthings/utilities';

export const options = z.object({
    pathToConfig: z.string().transform(relativePath => {
        if (relativePath.slice(0, 1) === '/') return relativePath
        return path.join(process.cwd(), relativePath)
    }).default(path.join(process.cwd(), 'uix.config.ts')).describe('Path to uix.config.ts file'),
});

export type CodegenOptions = TypeOf<typeof options>;
export const isDefault = true;

const Codegen: FC<{
    options: TypeOf<typeof options>;
}> = ({
    options
}) => CommandEnvironment({
    pathToConfig: options.pathToConfig,
    Command: () => {
        // Generate Code
        useOperation({
            dependencies: [useApplicationStore(store => store.uixConfig)],
            operationKey: 'codeGeneration',
            tryOp: async ([uixConfig]) => {
                await new Promise(resolve => setTimeout(resolve, 500))
                const pathToFiles = path.join(process.cwd(), uixConfig.outdir)
                await mkdir(pathToFiles, { recursive: true })
                await writeFile(
                    path.join(pathToFiles, 'functionModule.ts'),
                    functionModuleTemplate(uixConfig)
                )
                await writeFile(
                    path.join(pathToFiles, 'queryOptions.ts'),
                    queryOptionsTemplate()
                )
                await writeFile(
                    path.join(pathToFiles, 'staticObjects.ts'),
                    staticObjectsTemplate(uixConfig)
                )
                await writeFile(
                    path.join(pathToFiles, 'useUniqueChild.ts'),
                    useUniqueChildTemplate()
                )
                await writeFile(
                    path.join(pathToFiles, 'useNodeKey.ts'),
                    useNodeKeyTemplate()
                )
                await writeFile(
                    path.join(pathToFiles, 'useNodeSet.ts'),
                    useNodeSetTemplate()
                )
                await writeFile(
                    path.join(pathToFiles, 'useNodeIndex.ts'),
                    useNodeIndexTemplate()
                )
                await writeFile(
                    path.join(pathToFiles, 'useNodeType.ts'),
                    useNodeTypeTemplate()
                )
                return true
            },
            catchOp: (error: Error) => Err({
                type: 'Thinair CLI Error',
                subtype: 'CodeGenerationFailed',
                message: `Code generation failed: ${error.message}`,
                data: { error }
            }),
            render: {
                Success: ({ dependencies: [uixConfig] }) => <Text>✅ Code Generated @{uixConfig.outdir}: Fully-typed operations</Text>,
                Pending: () => <Loading text="Generating code..." />,
                Error: ({ error }) => <Text >❌ Error generating code: {error.message}</Text>
            }
        })
        const outputMap = useApplicationStore(store => store.outputMap)
        return (<>
            <Static items={[...outputMap].filter(([key, { Component, operationState }]) => operationState === 'success' || operationState === 'error')}>
                {([key, { Component }]) => <Box key={key}><Component /></Box>}
            </Static>
            <Box flexDirection='column'>
                {[...outputMap].some(([_, { operationState }]) => operationState === 'pending') ? <Loading text="Executing..." />
                    : [...outputMap].every(([_, { operationState }]) => operationState === 'success') ? <Text>🚀 Uix System Generation Complete!</Text>
                        : [...outputMap].some(([_, { operationState }]) => operationState === 'error') ? <Text>❌ Uix System Generation Failed!</Text>
                            : null}
            </Box>
            <SeedNeo4j />
        </>
        )
    }
})

export default Codegen;









