export default (app) => {
  // 1. Simulate initial build failure (Probot's check)
  app.on(['check_suite.requested', 'check_suite.rerequested'], async (context) => {
    const { head_sha } = context.payload.check_suite;
    
    await context.octokit.checks.create({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      name: 'Build Check', // Probot's check
      head_sha,
      status: 'completed',
      conclusion: 'failure',
      output: {
        title: 'Build Failed',
        summary: 'Use /override if necessary',
      },
    });
  });

  // 2. Handle override command
  app.on('issue_comment.created', async (context) => {
    const comment = context.payload.comment.body;
    const author = context.payload.comment.user.login;

    if (comment.trim().toLowerCase() === '/override') {
      // Verify maintainer permissions
      const { data: user } = await context.octokit.repos.getCollaboratorPermissionLevel({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        username: author,
      });
      
      if (!['admin', 'write'].includes(user.permission)) {
        await context.octokit.issues.createComment(context.issue({
          body: '⛔ Only maintainers can override!',
        }));
        return;
      }

      // Get PR details
      const pr = await context.octokit.pulls.get({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        pull_number: context.payload.issue.number,
      });
      const head_sha = pr.data.head.sha;

      // Get ALL checks for the PR
      const { data: checks } = await context.octokit.checks.listForRef({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        ref: head_sha,
      });

      // Override each required check
      await Promise.all(checks.check_runs.map(async (check) => {
        // Target both:
        // - GitHub Actions check (composite name)
        // - Probot's check
        if (check.name.includes('PR Build check') || check.name === 'Build Check') {
          await context.octokit.checks.update({
            owner: context.payload.repository.owner.login,
            repo: context.payload.repository.name,
            check_run_id: check.id, // Update existing check
            name: check.name,
            status: 'completed',
            conclusion: 'success',
            output: {
              title: 'Manually Overridden',
              summary: `Bypassed by @${author}`,
            },
          });
        }
      }));

      // Confirm in PR thread
      await context.octokit.issues.createComment(context.issue({
        body: `✅ All checks overridden by @${author}. You may now merge.`,
      }));
    }
  });
};