#!/usr/bin/env python3
"""
AI-Powered Deployment Risk Assessment Tool
Analyzes code changes, commit patterns, and historical data to predict deployment risk.
"""

import json
import os
import sys
import argparse
from datetime import datetime, timedelta
from pathlib import Path
import subprocess
import re


class DeploymentRiskAssessor:
    """AI-powered deployment risk assessment"""

    def __init__(self, repo_path):
        self.repo_path = Path(repo_path)
        self.risk_factors = []
        self.risk_score = 0

    def analyze(self):
        """Run complete risk analysis"""
        print("🤖 Starting AI-Powered Deployment Risk Assessment...")

        # Analyze different risk factors
        self.analyze_code_changes()
        self.analyze_commit_patterns()
        self.analyze_file_complexity()
        self.analyze_test_coverage()
        self.analyze_dependencies()
        self.analyze_recent_failures()

        # Calculate overall risk score
        self.calculate_risk_score()

        # Generate recommendation
        recommendation = self.generate_recommendation()

        return {
            "timestamp": datetime.now().isoformat(),
            "risk_score": self.risk_score,
            "risk_level": self.get_risk_level(),
            "recommendation": recommendation,
            "factors": self.risk_factors,
            "actions": self.generate_actions()
        }

    def analyze_code_changes(self):
        """Analyze code changes in recent commits"""
        try:
            # Get lines changed in last commit
            result = subprocess.run(
                ["git", "diff", "--stat", "HEAD~1", "HEAD"],
                capture_output=True,
                text=True,
                cwd=self.repo_path
            )

            if result.returncode == 0:
                stats = result.stdout
                # Parse stats to count changes
                lines_changed = 0
                files_changed = 0

                for line in stats.split('\n'):
                    if '|' in line:
                        files_changed += 1
                        match = re.search(r'(\d+)\s+\+', line)
                        if match:
                            lines_changed += int(match.group(1))
                        match = re.search(r'(\d+)\s+-', line)
                        if match:
                            lines_changed += int(match.group(1))

                # Risk based on size of changes
                if lines_changed > 500:
                    score = 8
                    desc = f"Large code change ({lines_changed} lines, {files_changed} files)"
                elif lines_changed > 200:
                    score = 5
                    desc = f"Medium code change ({lines_changed} lines, {files_changed} files)"
                else:
                    score = 2
                    desc = f"Small code change ({lines_changed} lines, {files_changed} files)"

                self.risk_factors.append({
                    "name": "Code Change Size",
                    "score": score,
                    "description": desc
                })

        except Exception as e:
            print(f"Warning: Could not analyze code changes: {e}")

    def analyze_commit_patterns(self):
        """Analyze commit patterns and frequency"""
        try:
            # Get commits from last 7 days
            result = subprocess.run(
                ["git", "log", "--since=7.days", "--oneline"],
                capture_output=True,
                text=True,
                cwd=self.repo_path
            )

            if result.returncode == 0:
                commits = result.stdout.strip().split('\n')
                commit_count = len([c for c in commits if c])

                # Risk based on commit frequency
                if commit_count > 50:
                    score = 7
                    desc = f"Very high commit frequency ({commit_count} commits in 7 days)"
                elif commit_count > 20:
                    score = 4
                    desc = f"High commit frequency ({commit_count} commits in 7 days)"
                elif commit_count < 3:
                    score = 6
                    desc = f"Low commit frequency ({commit_count} commits in 7 days) - possible rushed release"
                else:
                    score = 2
                    desc = f"Normal commit frequency ({commit_count} commits in 7 days)"

                self.risk_factors.append({
                    "name": "Commit Pattern",
                    "score": score,
                    "description": desc
                })

        except Exception as e:
            print(f"Warning: Could not analyze commit patterns: {e}")

    def analyze_file_complexity(self):
        """Analyze file complexity of changed files"""
        try:
            # Get list of changed files
            result = subprocess.run(
                ["git", "diff", "--name-only", "HEAD~1", "HEAD"],
                capture_output=True,
                text=True,
                cwd=self.repo_path
            )

            if result.returncode == 0:
                files = [f for f in result.stdout.strip().split('\n') if f]
                critical_files = 0

                # Check for critical file patterns
                critical_patterns = [
                    'database', 'migration', 'config', 'auth',
                    'security', 'payment', 'billing'
                ]

                for file in files:
                    for pattern in critical_patterns:
                        if pattern in file.lower():
                            critical_files += 1
                            break

                if critical_files > 0:
                    score = min(critical_files * 2, 10)
                    desc = f"{critical_files} critical files modified (database, auth, security, etc.)"
                else:
                    score = 1
                    desc = "No critical files modified"

                self.risk_factors.append({
                    "name": "File Criticality",
                    "score": score,
                    "description": desc
                })

        except Exception as e:
            print(f"Warning: Could not analyze file complexity: {e}")

    def analyze_test_coverage(self):
        """Analyze test coverage from recent test run"""
        coverage_file = self.repo_path / "backend" / "coverage" / "coverage-summary.json"

        try:
            if coverage_file.exists():
                with open(coverage_file, 'r') as f:
                    coverage_data = json.load(f)
                    total = coverage_data.get('total', {})
                    lines_pct = total.get('lines', {}).get('pct', 0)

                    if lines_pct < 40:
                        score = 9
                        desc = f"Low test coverage ({lines_pct}%)"
                    elif lines_pct < 60:
                        score = 6
                        desc = f"Medium test coverage ({lines_pct}%)"
                    elif lines_pct < 80:
                        score = 3
                        desc = f"Good test coverage ({lines_pct}%)"
                    else:
                        score = 1
                        desc = f"Excellent test coverage ({lines_pct}%)"

                    self.risk_factors.append({
                        "name": "Test Coverage",
                        "score": score,
                        "description": desc
                    })
            else:
                self.risk_factors.append({
                    "name": "Test Coverage",
                    "score": 5,
                    "description": "No coverage data available"
                })

        except Exception as e:
            print(f"Warning: Could not analyze test coverage: {e}")
            self.risk_factors.append({
                "name": "Test Coverage",
                "score": 5,
                "description": f"Could not read coverage data: {e}"
            })

    def analyze_dependencies(self):
        """Analyze dependency changes"""
        try:
            result = subprocess.run(
                ["git", "diff", "HEAD~1", "HEAD", "--", "package.json", "package-lock.json"],
                capture_output=True,
                text=True,
                cwd=self.repo_path
            )

            if result.returncode == 0 and result.stdout:
                # Dependencies were changed
                if "version" in result.stdout:
                    score = 6
                    desc = "Dependencies updated - requires thorough testing"
                else:
                    score = 3
                    desc = "Minor dependency changes"

                self.risk_factors.append({
                    "name": "Dependency Changes",
                    "score": score,
                    "description": desc
                })
            else:
                self.risk_factors.append({
                    "name": "Dependency Changes",
                    "score": 1,
                    "description": "No dependency changes"
                })

        except Exception as e:
            print(f"Warning: Could not analyze dependencies: {e}")

    def analyze_recent_failures(self):
        """Analyze recent CI/CD failures"""
        # This would integrate with CI/CD API in production
        # For now, we'll use a simplified heuristic

        try:
            # Check for common failure indicators in recent commits
            result = subprocess.run(
                ["git", "log", "--since=7.days", "--grep=fix", "--grep=bug", "--grep=hotfix", "-i", "--oneline"],
                capture_output=True,
                text=True,
                cwd=self.repo_path
            )

            if result.returncode == 0:
                fixes = result.stdout.strip().split('\n')
                fix_count = len([f for f in fixes if f])

                if fix_count > 5:
                    score = 7
                    desc = f"High number of recent fixes ({fix_count}) - possible instability"
                elif fix_count > 2:
                    score = 4
                    desc = f"Some recent fixes ({fix_count})"
                else:
                    score = 1
                    desc = f"Few recent fixes ({fix_count}) - good stability"

                self.risk_factors.append({
                    "name": "Recent Stability",
                    "score": score,
                    "description": desc
                })

        except Exception as e:
            print(f"Warning: Could not analyze recent failures: {e}")

    def calculate_risk_score(self):
        """Calculate overall risk score using weighted average"""
        if not self.risk_factors:
            self.risk_score = 50  # Default medium risk
            return

        # Weighted calculation
        weights = {
            "Code Change Size": 1.5,
            "File Criticality": 2.0,
            "Test Coverage": 2.0,
            "Dependency Changes": 1.5,
            "Recent Stability": 1.0,
            "Commit Pattern": 0.8
        }

        total_weight = 0
        weighted_sum = 0

        for factor in self.risk_factors:
            name = factor["name"]
            score = factor["score"]
            weight = weights.get(name, 1.0)

            weighted_sum += score * weight
            total_weight += weight

        # Normalize to 0-100 scale
        if total_weight > 0:
            self.risk_score = int((weighted_sum / total_weight) * 10)
        else:
            self.risk_score = 50

    def get_risk_level(self):
        """Get risk level category"""
        if self.risk_score >= 80:
            return "CRITICAL"
        elif self.risk_score >= 60:
            return "HIGH"
        elif self.risk_score >= 40:
            return "MEDIUM"
        elif self.risk_score >= 20:
            return "LOW"
        else:
            return "MINIMAL"

    def generate_recommendation(self):
        """Generate deployment recommendation"""
        risk_level = self.get_risk_level()

        recommendations = {
            "CRITICAL": "❌ DO NOT DEPLOY - Critical risk detected. Address all high-risk factors before deployment.",
            "HIGH": "⚠️ DEPLOY WITH CAUTION - High risk. Requires additional testing and monitoring.",
            "MEDIUM": "✅ SAFE TO DEPLOY - Medium risk. Standard deployment process recommended.",
            "LOW": "✅ SAFE TO DEPLOY - Low risk. Normal deployment with standard monitoring.",
            "MINIMAL": "✅ SAFE TO DEPLOY - Minimal risk. Proceed with confidence."
        }

        return recommendations.get(risk_level, "Unknown risk level")

    def generate_actions(self):
        """Generate recommended actions based on risk factors"""
        actions = []

        for factor in self.risk_factors:
            score = factor["score"]
            name = factor["name"]

            if score >= 7:
                if "Code Change" in name:
                    actions.append("Consider breaking down large changes into smaller deployments")
                elif "Test Coverage" in name:
                    actions.append("Increase test coverage before deploying")
                elif "Critical" in name:
                    actions.append("Conduct thorough testing of critical system components")
                elif "Dependency" in name:
                    actions.append("Review all dependency updates for breaking changes")
                elif "Stability" in name:
                    actions.append("Investigate recent stability issues before deployment")

        if not actions:
            actions.append("Proceed with standard deployment process")
            actions.append("Monitor system health post-deployment")

        return actions


def main():
    parser = argparse.ArgumentParser(description='AI-Powered Deployment Risk Assessment')
    parser.add_argument('--repo-path', default='.', help='Path to git repository')
    parser.add_argument('--output', default='risk-report.json', help='Output file for risk report')

    args = parser.parse_args()

    assessor = DeploymentRiskAssessor(args.repo_path)
    report = assessor.analyze()

    # Print summary
    print("\n" + "="*60)
    print("📊 DEPLOYMENT RISK ASSESSMENT SUMMARY")
    print("="*60)
    print(f"Risk Score: {report['risk_score']}/100")
    print(f"Risk Level: {report['risk_level']}")
    print(f"\n{report['recommendation']}")
    print("\nRisk Factors:")
    for factor in report['factors']:
        print(f"  • {factor['name']}: {factor['score']}/10 - {factor['description']}")
    print("\nRecommended Actions:")
    for action in report['actions']:
        print(f"  → {action}")
    print("="*60)

    # Save report
    with open(args.output, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n✅ Risk report saved to {args.output}")

    # Exit with appropriate code
    if report['risk_level'] in ['CRITICAL', 'HIGH']:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
