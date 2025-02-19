
import React, { FC, useEffect } from 'react'
import { ErrType, Result, tryCatch } from '@thinairthings/utilities'
import { skipToken, useQuery } from '@tanstack/react-query'
import { applicationStore } from '../(stores)/applicationStore'
import { Box } from 'ink'

type Strictify<T extends readonly any[]> = { [K in keyof T]-?: T[K] & {} }

export const useOperation = <
    OperationKey extends string,
    T,
    ErrorType extends string,
    ErrorSubtype extends string,
    ErrorData extends Record<string, any> | undefined,
    Dependencies extends readonly any[]
>({
    operationKey,
    tryOp,
    catchOp,
    finallyOp,
    render,
    dependencies
}: {
    operationKey: OperationKey
    tryOp: (dependencies: Strictify<Dependencies>) => Promise<T> | T,
    catchOp: (error: any, dependencies: Strictify<Dependencies>) => Result<never, ErrType<ErrorType, ErrorSubtype, ErrorData>>,
    finallyOp?: (dependencies: Strictify<Dependencies>) => void,
    render: {
        Success: FC<{ data: T, dependencies: Strictify<Dependencies> }>
        Pending: FC<{ dependencies: Strictify<Dependencies> }>
        Error: FC<{ error: ErrType<ErrorType, ErrorSubtype, ErrorData>, dependencies: Strictify<Dependencies> }>
    }
    dependencies: Dependencies
}) => {
    const { data: result } = useQuery({
        queryKey: [operationKey],
        queryFn: dependencies.length === 0
            ? async () => await tryCatch({
                try: () => tryOp(dependencies as Strictify<Dependencies>),
                catch: (error) => catchOp(error, dependencies as Strictify<Dependencies>),
                finally: () => finallyOp?.(dependencies as Strictify<Dependencies>)
            })
            : dependencies.every(dependency => (!!dependency))
                ? async () => await tryCatch({
                    try: () => tryOp(dependencies as Strictify<Dependencies>),
                    catch: (error) => catchOp(error, dependencies as Strictify<Dependencies>),
                    finally: () => finallyOp?.(dependencies as Strictify<Dependencies>)
                })
                : skipToken
    })
    useEffect(() => {
        if (!result) {
            applicationStore.setState(({ outputMap }) => {
                outputMap.set(operationKey, {
                    Component: () => {
                        return (
                            <Box>
                                <render.Pending
                                    dependencies={dependencies as Strictify<Dependencies>}
                                />
                            </Box>
                        )
                    },
                    operationState: 'pending'
                })
            })
            return
        }
        const { error, data } = result
        if (error) {
            applicationStore.setState(({ outputMap }) => {
                outputMap.set(operationKey, {
                    Component: () => {
                        return (
                            <Box>
                                <render.Error
                                    error={error}
                                    dependencies={dependencies as Strictify<Dependencies>}
                                />
                            </Box>
                        )
                    },
                    operationState: 'error'
                })
            })
            return
        }
        if (data) {
            applicationStore.setState(({ outputMap }) => {
                outputMap.set(operationKey, {
                    Component: () => {
                        return (
                            <Box>
                                <render.Success
                                    data={data}
                                    dependencies={dependencies as Strictify<Dependencies>}
                                />
                            </Box>
                        )
                    },
                    operationState: 'success'
                })
            })
        }
    }, [result])
    return result?.data
}