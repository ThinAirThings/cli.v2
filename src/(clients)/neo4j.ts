import neo4j from 'neo4j-driver';
import { Neo4jError } from "neo4j-driver"
import { AnyErrType, Err, ErrType, Result } from '@thinairthings/utilities';
import { Action } from '@thinairthings/utilities';


export const createNeo4jClient = (config: {
    uri: string
    username: string
    password: string,
}, options?: Parameters<typeof neo4j.driver>[2]) => {
    return neo4j.driver(
        config.uri,
        neo4j.auth.basic(config.username, config.password),
        options
    )
}


export const Neo4jErr = (
    error: Neo4jError,
) => Err({
    type: 'Neo4jErr',
    subtype: Neo4jErrorSubtype.UNKNOWN,
    message: error.message,
    data: JSON.parse(JSON.stringify({
        ...error
    }))
})

export enum Neo4jErrorSubtype {
    UNKNOWN = 'UNKNOWN',
}

export const neo4jAction = <
    Input extends any[],
    T,
    PrevErrType extends AnyErrType,
>(
    // fnName: string,
    fn: Action<Input, T, PrevErrType>
) => async (
    ...args: Input
): Promise<
    Result<T,
        | PrevErrType
        | ErrType<'Neo4jErr', Neo4jErrorSubtype.UNKNOWN, Neo4jError>
    >
> => {
        // console.log("Running", fnName, "with args", args)
        try {
            return await fn(...args)
        } catch (e) {
            if (!(e instanceof Neo4jError)) throw e
            return Neo4jErr(
                // fnName,
                e
            )
        }
    }
