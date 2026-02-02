# Go2 Project Governance

This document describes the governance model for the Go2 open source project.

## Overview

Go2 is a community-driven open source project. We believe in transparent decision-making, inclusive participation, and meritocratic advancement.

## Roles

### Contributors

Anyone who contributes to Go2 in any way:

- Code contributions
- Documentation improvements
- Bug reports and feature requests
- Helping others in the community
- Spreading the word

**How to become one**: Make any contribution!

### Committers

Trusted contributors with write access to the repository.

**Responsibilities**:
- Review and merge pull requests
- Triage issues
- Maintain code quality
- Mentor new contributors

**How to become one**: Demonstrate sustained, quality contributions over time. Nomination by existing committers, followed by vote.

### Maintainers

Core team members responsible for project direction.

**Responsibilities**:
- Set project roadmap and priorities
- Make architectural decisions
- Manage releases
- Resolve disputes
- Ensure project health

**Current Maintainers**:
- Core Go2 Team ([@Rakesh1002](https://github.com/Rakesh1002))

### Technical Steering Committee (TSC)

For major decisions that affect the project's direction.

**Responsibilities**:
- Approve breaking changes
- Decide on major features
- Resolve technical disputes
- Oversee security issues

**Composition**: Maintainers + elected community representatives

## Decision Making

### Lazy Consensus

Most decisions are made through lazy consensus:

1. Proposal is made (issue, PR, or discussion)
2. If no objections after reasonable time (typically 72 hours for small changes, 1 week for larger ones), the proposal is accepted
3. Silence = consent

### Voting

For contentious issues or major changes:

- Simple majority for regular decisions
- 2/3 majority for governance changes
- All votes are public

### RFC Process

Major changes require an RFC (Request for Comments):

1. Open a GitHub Discussion with `[RFC]` prefix
2. Community discussion period (minimum 2 weeks)
3. Revisions based on feedback
4. TSC vote to accept/reject
5. Implementation begins

## Code of Conduct

All participants must follow our [Code of Conduct](CODE_OF_CONDUCT.md). Violations are handled by maintainers with escalation to the TSC if needed.

## Contribution Guidelines

See [CONTRIBUTING.md](CONTRIBUTING.md) for technical contribution guidelines.

## Communication Channels

| Channel | Purpose |
|---------|---------|
| [GitHub Issues](https://github.com/Rakesh1002/go2.gg/issues) | Bug reports, feature requests |
| [GitHub Discussions](https://github.com/Rakesh1002/go2.gg/discussions) | Questions, RFCs, general discussion |
| [Twitter/X](https://x.com/BuildWithRakesh) | Announcements, updates |

## Release Process

1. **Feature freeze**: Announced 1 week before release
2. **Release candidate**: Published for testing
3. **Release**: After RC validation (typically 3-5 days)
4. **Changelog**: Published with release notes

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **Major**: Breaking changes
- **Minor**: New features (backwards compatible)
- **Patch**: Bug fixes

## Security

Security vulnerabilities are handled through our [Security Policy](SECURITY.md):

1. Report privately to security@go2.gg
2. Maintainers assess and develop fix
3. Coordinated disclosure

## Relationship with Go2 Cloud

Go2 (the open source project) and Go2 Cloud (the hosted service) are related but distinct:

- **Go2 OSS**: Community-governed open source project
- **Go2 Cloud**: Commercial service run by Go2 Inc.

The open source project:
- Receives contributions from Go2 Inc. team
- Is not owned or controlled by Go2 Inc.
- Makes decisions through community governance
- Maintains feature parity with Go2 Cloud

Go2 Inc. commits to:
- Contributing improvements back to open source
- Not creating proprietary forks
- Supporting the community
- Sponsoring infrastructure (CI, hosting docs)

## Amendments

This governance document can be amended through the RFC process with a 2/3 majority vote of the TSC.

---

*Last updated: January 2026*
