import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const token: string = core.getInput('github-token')
    const octokit = github.getOctokit(token)
    // check if this is a pull request
    if (github.context.payload.pull_request) {
      const wipStartWith = core.getInput('wip-start-with')
      const wipLabel = core.getInput('wip-label')
      const readyLabel = core.getInput('ready-label')
      const approvedLabel = core.getInput('approved-label')

      const pullRequest = github.context.payload.pull_request
  
      // check if the pull request title starts with the WIP string
      if (pullRequest.title.startsWith(wipStartWith)) {
        // check if label is not set
        if (!pullRequest.labels.some((label: any) => label.name === wipLabel)) {
          // add label
          await octokit.rest.issues.addLabels({
            ...github.context.repo,
            issue_number: pullRequest.number,
            labels: [wipLabel]
          })
        }
      } else {
        // check if label is set
        if (pullRequest.labels.some((label: any) => label.name === wipLabel)) {
          // remove label
          await octokit.rest.issues.removeLabel({
            ...github.context.repo,
            issue_number: pullRequest.number,
            name: wipLabel
          })
        }
      }

      // check if the pull request is not wip
      if (!pullRequest.title.startsWith(wipStartWith)) {
        // check if label is not set
        if (!pullRequest.labels.some((label: any) => label.name === readyLabel)) {
          // add label
          await octokit.rest.issues.addLabels({
            ...github.context.repo,
            issue_number: pullRequest.number,
            labels: [readyLabel]
          })
        }
      } else {
        // check if label is set
        if (pullRequest.labels.some((label: any) => label.name === readyLabel)) {
          // remove label
          await octokit.rest.issues.removeLabel({
            ...github.context.repo,
            issue_number: pullRequest.number,
            name: readyLabel
          })
        }
      }
      
      // check if the pull request is all approved and does not have the approved label
      if (pullRequest.labels.some((label: any) => label.name === readyLabel) && !pullRequest.labels.some((label: any) => label.name === approvedLabel)) {
        // check if the pull request has the approved label
        if (pullRequest.requested_reviewers.length === pullRequest.requested_reviewers.filter((reviewer: any) => reviewer.state === 'APPROVED').length) {
          // add label
          await octokit.rest.issues.addLabels({
            ...github.context.repo,
            issue_number: pullRequest.number,
            labels: [approvedLabel]
          })
        }
      }
  
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
