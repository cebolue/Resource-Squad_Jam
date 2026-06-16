const axios = require('axios');

const getAuthHeader = () => {
  const pat = process.env.AZURE_DEVOPS_PAT;
  if (!pat) {
    throw new Error('AZURE_DEVOPS_PAT is required in environment variables');
  }
  const token = Buffer.from(`:${pat}`).toString('base64');
  return { Authorization: `Basic ${token}` };
};

const fetchAzureDevOps = async (url, params = {}) => {
  const response = await axios.get(url, {
    headers: {
      Accept: 'application/json',
      ...getAuthHeader(),
    },
    params,
  });
  return response.data;
};

const queryWorkItems = async (organization, project, wiql) => {
  const url = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.1-preview.2`;
  const response = await axios.post(url, wiql, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  return response.data.workItems || [];
};

const getWorkItemDetails = async (organization, project, ids, fields = []) => {
  if (!ids.length) return [];
  const url = `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_apis/wit/workitemsbatch?api-version=7.1-preview.3`;
  const response = await axios.post(url, {
    ids,
    fields,
  }, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  return response.data.value || [];
};

const buildQuery = ({ project, areaPath, iterationPath, includeClosed = true }) => {
  const areaClause = `AND [System.AreaPath] UNDER '${areaPath.replace(/'/g, "''")}'`;
  const iterationClause = iterationPath
    ? `AND [System.IterationPath] UNDER '${iterationPath.replace(/'/g, "''")}'`
    : '';

  const stateClause = includeClosed
    ? "AND [System.State] IN ('Done', 'Closed', 'Removed', 'Resolved')"
    : "AND [System.State] NOT IN ('Removed')";

  const types = ['Bug', 'Product Backlog Item', 'User Story', 'Requirement'];
  const typeClause = `AND [System.WorkItemType] IN (${types.map((t) => `'${t}'`).join(', ')})`;

  return `SELECT [System.Id]
FROM WorkItems
WHERE [System.TeamProject] = '${project.replace(/'/g, "''")}'
  ${areaClause}
  ${iterationClause}
  ${stateClause}
  ${typeClause}`;
};

const getTeamMetrics = async ({ organization, project, areaPath, iterationPath }) => {
  const wiql = { query: buildQuery({ project, areaPath, iterationPath, includeClosed: true }) };
  const workItems = await queryWorkItems(organization, project, wiql);
  const ids = workItems.map((item) => item.id);
  const fields = [
    'System.Id',
    'System.Title',
    'System.AssignedTo',
    'System.IterationPath',
    'System.WorkItemType',
    'System.State',
    'Microsoft.VSTS.Scheduling.OriginalEstimate',
    'Microsoft.VSTS.Scheduling.CompletedWork',
    'Microsoft.VSTS.Scheduling.RemainingWork',
    'Microsoft.VSTS.Scheduling.Effort',
  ];

  const details = await getWorkItemDetails(organization, project, ids, fields);
  const items = details.map((item) => ({
    id: item.id,
    title: item.fields['System.Title'],
    assignedTo: item.fields['System.AssignedTo']?.displayName || null,
    iterationPath: item.fields['System.IterationPath'],
    workItemType: item.fields['System.WorkItemType'],
    state: item.fields['System.State'],
    originalEstimate: Number(item.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || 0),
    completedWork: Number(item.fields['Microsoft.VSTS.Scheduling.CompletedWork'] || 0),
    remainingWork: Number(item.fields['Microsoft.VSTS.Scheduling.RemainingWork'] || 0),
  }));

  const isBugOrRequirement = (type) =>
    ['Bug', 'Requirement', 'Product Backlog Item', 'User Story'].includes(type);

  const completedItems = items.filter((item) => isBugOrRequirement(item.workItemType));
  const totalOriginalEstimate = completedItems.reduce((sum, item) => sum + item.originalEstimate, 0);
  const totalCompletedWork = completedItems.reduce((sum, item) => sum + item.completedWork, 0);
  const averageCompletedHours = completedItems.length
    ? totalCompletedWork / completedItems.length
    : 0;

  const metrics = {
    itemCount: items.length,
    originalEstimate: totalOriginalEstimate,
    completedWork: totalCompletedWork,
    sprintVelocity: totalCompletedWork,
    averageCompletedHours,
    bugsAndRequirementsCompleted: totalCompletedWork,
    workItems: items,
  };

  return metrics;
};

module.exports = {
  fetchAzureDevOps,
  getTeamMetrics,
};
