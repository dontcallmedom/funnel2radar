const ghrequest = require("gh-api-request");
const graphql = require("./graphql.js");
const config = require("./config.json");

ghrequest.ghToken = config.ghapitoken;
ghrequest.accept = "application/vnd.github.starfox-preview";

const projectEvents = ["added_to_project", "moved_columns_in_project", "removed_from_project"];


async function fetchProjectCards(acc = [], cursor = null) {
  let res;
  try {
    res = await graphql(`
 query {
   repository(name:"strategy" owner:"w3c") {
         issues(first:100 ${cursor ? 'after:"' + cursor + '"' : ''}) {
            edges {
              node {
                number
                title
                createdAt
                updatedAt
                closedAt
                url
                assignees(first: 10) {
                   nodes { login name }
                }
                comments(last: 100) {
                   nodes { createdAt }
                }
                labels(first: 100) {
                   nodes { color name }
                }
                projectCards(first: 1) {
                   nodes {
                     column {name}
                     updatedAt
                   }
                }
                timelineItems(first: 100 itemTypes:[ADDED_TO_PROJECT_EVENT MOVED_COLUMNS_IN_PROJECT_EVENT REMOVED_FROM_PROJECT_EVENT]) {
                  nodes {
                    ...on AddedToProjectEvent { __typename projectColumnName createdAt}
                    ...on MovedColumnsInProjectEvent { __typename projectColumnName previousProjectColumnName createdAt }
                    ...on RemovedFromProjectEvent { __typename projectColumnName createdAt }
                  }
                }
              }
            }
            pageInfo {
       	      endCursor
      	      hasNextPage
            }
       }
     }
   }`);
  } catch (err) {
    console.error(err);
  }
  if (res && res.repository) {
    const data = acc.concat(res.repository.issues.edges);
    if (res.repository.issues.pageInfo.hasNextPage) {
      return fetchProjectCards(data, res.repository.issues.pageInfo.endCursor);
    } else {
      return data;
    }
  }  else {
    console.error("Fetching issues at cursor " + cursor + " failed with " + JSON.stringify(res)+ ", not retrying");
    return acc;
  }
}

fetchProjectCards().then(cards =>
  console.log(JSON.stringify(cards, null, 2))
                        );
