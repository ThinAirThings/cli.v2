import { GenericUixConfig } from "../config/defineConfig";



export const functionModuleTemplate = (config: GenericUixConfig) => {
    return /* ts */`
'use server'
// Start of File
import uixConfig from '${config.pathToConfig.replace('uix.config.ts', 'uix.config')}'
import {
    createNodeFactory, 
    updateNodeFactory, 
    deleteNodeFactory, 
    getNodeByKeyFactory, 
    getVectorNodeByKeyFactory,
    getAllOfNodeTypeFactory,
    getChildNodeSetFactory,
    getUniqueChildNodeFactory,
    getNodeByIndexFactory,
    NodeKey
} from '@thinairthings/uix'
import neo4j from 'neo4j-driver'
import OpenAI from 'openai'

export const driver = neo4j.driver(
    process.env.NEO4J_URI!, 
    neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
)
const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
})

export const createNode = createNodeFactory(driver, openaiClient, uixConfig.graph.nodeTypeMap)
export const updateNode = updateNodeFactory(driver, openaiClient, uixConfig.graph.nodeTypeMap)
export const deleteNode = deleteNodeFactory(driver, uixConfig.graph.nodeTypeMap)
export const getNodeByKey = getNodeByKeyFactory(driver, uixConfig.graph.nodeTypeMap)
export const getVectorNodeByKey = getVectorNodeByKeyFactory(driver, uixConfig.graph.nodeTypeMap)
export const getAllOfNodeType = getAllOfNodeTypeFactory(driver, uixConfig.graph.nodeTypeMap)
export const getChildNodeSet = getChildNodeSetFactory(driver, uixConfig.graph.nodeTypeMap)
export const getUniqueChildNode = getUniqueChildNodeFactory(driver, uixConfig.graph.nodeTypeMap)
export const getNodeByIndex = getNodeByIndexFactory(driver, uixConfig.graph.nodeTypeMap)

`}