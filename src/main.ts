import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const token: string = core.getInput('github_token')
    const octokit = github.getOctokit(token)
    // check if this is a pull request
    if (github.context.payload.pull_request) {
      core.info(JSON.stringify(github.context.payload.pull_request))
      const wipStartWith = core.getInput('wip_start_with')
      const wipLabel = core.getInput('wip_label')
      const readyLabel = core.getInput('ready_label')
      const approvedLabel = core.getInput('approved_label')

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

      // check if the pull request is not wip
      if (!pullRequest.title.startsWith(wipStartWith)) {
        // get all requested reviewers
        const reviewers = await octokit.rest.pulls.listRequestedReviewers({
          ...github.context.repo,
          pull_number: pullRequest.number
        })
        core.info(JSON.stringify(reviewers))
        // check if reviewers are requested
        if (reviewers.data.users.length > 0) {
          // check if all reviewers approved the pull request
          if (reviewers.data.users.length === reviewers.data.users.filter((reviewer: any) => reviewer.state === 'APPROVED').length) {
            // check if label is not set
            if (!pullRequest.labels.some((label: any) => label.name === approvedLabel)) {
              // add label
              await octokit.rest.issues.addLabels({
                ...github.context.repo,
                issue_number: pullRequest.number,
                labels: [approvedLabel]
              })
            }
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
