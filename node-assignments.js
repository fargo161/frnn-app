import { STATIONS } from './lib.js';

export function normalizeAssignedMessage(value) {
  if (typeof value !== 'string') return null;
  const message = value.trim();
  return message.length >= 1 && message.length <= 1000 ? message : null;
}

export async function resolveNodeAssignment(client, { code, nodeKey, authoredDefault }) {
  if (!STATIONS.includes(nodeKey)) {
    throw new Error(`Unknown canonical node key: ${nodeKey}`);
  }

  const result = await client.query(`
    SELECT assigned_message
    FROM node_assignments
    WHERE code=$1
      AND node_key=$2
      AND assignment_type='assigned_message'
      AND is_active=TRUE
    LIMIT 1
  `, [code, nodeKey]);

  const assignedMessage = result.rows[0]?.assigned_message;
  if (assignedMessage !== undefined) {
    return {
      nodeKey,
      source: 'assignment',
      assignedMessage
    };
  }

  return {
    nodeKey,
    source: 'default',
    assignedMessage: authoredDefault
  };
}
