const cards = require("./cards.json");
const rings = {
  "Chartering": 0,
  "Evaluation": 1,
  "Incubation": 2,
  "Investigation": 3,
  "Exploration": 4,
  "Parking Lot": 5
};

const since='2019-04-01';
const arrLast = arr => arr[arr.length - 1];

const hasMoved = timelineItems => {
  const lastEvent = timelineItems[timelineItems.length - 1];
  if (!lastEvent) return 0;
  if (lastEvent.createdAt > since) {
    switch(lastEvent.__typename) {
    case "AddedToProjectEvent":
      return 1;
    case "MovedColumnsInProjectEvent":
      if (rings[lastEvent.previousProjectColumnName] === undefined) return 1;
      if (rings[lastEvent.previousProjectColumnName] > rings[lastEvent.projectColumnName]) return 1;
      return -1;
    }
  }
  return 0;
}

const quadrantFromLabel = l => {
  if (l.match(/workshop/i)) return 1;
  if (l.match(/ WG/) || l.match(/Working Group/i) || l.match(/Interest Group/i) || l.match(/ IG/) || l.match(/charter/i)) return 2;
  return 0;
};

const entrySort = (a, b) => {
  if (rings[a.node.projectCards.nodes[0].column.name] !== rings[b.node.projectCards.nodes[0].column.name])
    return rings[a.node.projectCards.nodes[0].column.name] - rings[b.node.projectCards.nodes[0].column.name];
  return b.node.comments.nodes.length - a.node.comments.nodes.length;
}

const radar = cards.filter(c => c.node.projectCards.nodes[0] && c.node.projectCards.nodes[0].column && Object.keys(rings).includes(c.node.projectCards.nodes[0].column.name)).sort(entrySort)
      .map(c => {
        return {
          number: c.node.number,
          quadrant: 0, //quadrantFromLabel(c.node.title),
          ring: rings[c.node.projectCards.nodes[0].column.name],
          label: c.node.title,
          active: c.node.assignees.nodes.length > 0,
          link: c.node.url,
          moved: hasMoved(c.node.timelineItems.nodes),
          updatedAt: c.node.updatedAt,
          lastMovedAt: arrLast(c.node.timelineItems.nodes.map(t => t ? t.createdAt : 0)),
          lastActiveAt: arrLast(([c.node.updatedAt, arrLast(c.node.timelineItems.nodes.map(t => t ? t.createdAt : 0)) || 0].concat(c.node.comments.nodes.map(c => c.createdAt))).sort()),
          assignees: c.node.assignees.nodes.map(a => a.name),
          comments: c.node.comments.nodes.map(c => c.createdAt),
          labels: c.node.labels.nodes
        }});
console.log(JSON.stringify(radar, null, 2));
