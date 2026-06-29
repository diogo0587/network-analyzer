import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import type { PacketHeader } from "./types"

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME
const PK = process.env.DYNAMODB_TABLE_PARTITION_KEY || "PK"

// DynamoDB configuration - timestamp is a reserved keyword, use ExpressionAttributeNames

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN,
    clientConfig: { region: process.env.AWS_REGION },
  }),
})

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

// Store packets in DynamoDB
export async function storePacket(packet: PacketHeader): Promise<void> {
  try {
    const item = {
      [PK]: `PACKET#${packet.id}#${Date.now()}`,
      GSI1PK: "PACKETS",
      GSI1SK: packet.timestamp,
      id: packet.id,
      timestamp: packet.timestamp,
      sourceIp: packet.sourceIp,
      destIp: packet.destIp,
      sourcePort: packet.sourcePort,
      destPort: packet.destPort,
      protocol: packet.protocol,
      size: packet.size,
      isSuspicious: packet.isSuspicious,
      ttl: Math.floor(Date.now() / 1000) + 86400, // 24 hours TTL
    }

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    )
  } catch (error) {
    console.error("[v0] Error storing packet:", error)
    throw error
  }
}

// Get all packets from DynamoDB
export async function getStoredPackets(limit = 100): Promise<PacketHeader[]> {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Limit: limit,
      })
    )

    return (result.Items || []).map((item: any) => ({
      id: item.id,
      timestamp: item.timestamp,
      sourceIp: item.sourceIp,
      destIp: item.destIp,
      sourcePort: item.sourcePort,
      destPort: item.destPort,
      protocol: item.protocol,
      size: item.size,
      isSuspicious: item.isSuspicious,
    })) as PacketHeader[]
  } catch (error) {
    console.error("[v0] Error getting packets:", error)
    return []
  }
}

// Get recent packets - returns empty array since we use live monitor instead
export async function getRecentPackets(
  minutes = 60,
  limit = 100
): Promise<PacketHeader[]> {
  // DynamoDB queries are handled by storePacket for persistence
  // Live data comes from the network monitor instead
  return []
}

// Delete old packets (cleanup)
export async function deleteOldPackets(hoursOld = 24): Promise<void> {
  try {
    const cutoffTime = Date.now() - hoursOld * 60 * 60 * 1000

    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#ts < :cutoff",
        ExpressionAttributeNames: {
          "#ts": "timestamp",
        },
        ExpressionAttributeValues: {
          ":cutoff": cutoffTime,
        },
        ProjectionExpression: PK,
      })
    )

    // Delete each item
    for (const item of result.Items || []) {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { [PK]: item[PK] },
        })
      )
    }
  } catch (error) {
    console.error("[v0] Error deleting old packets:", error)
  }
}

// Get packet statistics
export async function getPacketStats(): Promise<{
  totalPackets: number
  suspiciousCount: number
  totalBytes: number
}> {
  try {
    const packets = await getStoredPackets(1000)

    return {
      totalPackets: packets.length,
      suspiciousCount: packets.filter((p) => p.isSuspicious).length,
      totalBytes: packets.reduce((sum, p) => sum + p.size, 0),
    }
  } catch (error) {
    console.error("[v0] Error getting stats:", error)
    return {
      totalPackets: 0,
      suspiciousCount: 0,
      totalBytes: 0,
    }
  }
}
