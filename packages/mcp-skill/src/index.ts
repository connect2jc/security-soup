#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { securityScan, securityScore, checkSkill } from "./tools.js";

const server = new Server(
  { name: "securesecrets", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "security_scan",
      description:
        "Scan for exposed secrets, API keys, and credentials on this machine",
      inputSchema: {
        type: "object" as const,
        properties: {
          path: {
            type: "string",
            description: "Directory to scan (defaults to home)",
          },
          deep: {
            type: "boolean",
            description: "Include git history scanning",
          },
        },
      },
    },
    {
      name: "security_score",
      description:
        "Get a security score (0-100) for this machine's configuration",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "check_skill",
      description:
        "Audit a specific installed skill's permissions and security",
      inputSchema: {
        type: "object" as const,
        properties: {
          skillName: {
            type: "string",
            description: "Name of the skill to audit",
          },
        },
        required: ["skillName"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "security_scan": {
      const result = await securityScan({
        path: (args as Record<string, unknown>)?.["path"] as string | undefined,
        deep: (args as Record<string, unknown>)?.["deep"] as boolean | undefined,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
    case "security_score": {
      const result = await securityScore();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
    case "check_skill": {
      const skillName = (args as Record<string, unknown>)?.["skillName"] as string;
      const result = await checkSkill({ skillName });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
