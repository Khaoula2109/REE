#!/usr/bin/env python3
"""
Intelligent Maintenance Orchestrator
Coordinates all maintenance systems: anomaly detection, incident prioritization,
and auto-fix suggestions to provide a complete maintenance workflow.
"""

import json
import argparse
import sys
import subprocess
import os
from datetime import datetime


class MaintenanceOrchestrator:
    """Orchestrates entire predictive maintenance workflow"""

    def __init__(self, metrics_file=None, logs_file=None, health_report=None):
        self.metrics_file = metrics_file
        self.logs_file = logs_file
        self.health_report = health_report
        self.scripts_dir = os.path.dirname(os.path.abspath(__file__))
        self.reports = {}

    def orchestrate(self):
        """Execute complete maintenance workflow"""
        print("="*70)
        print("🤖 INTELLIGENT PREDICTIVE MAINTENANCE SYSTEM")
        print("="*70)
        print(f"\nStarted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        # Step 1: Anomaly Detection
        print("📍 STEP 1/4: Running Anomaly Detection...")
        print("-" * 70)
        anomaly_report = self.run_anomaly_detection()

        if not anomaly_report:
            print("❌ Anomaly detection failed. Cannot proceed.")
            return None

        self.reports['anomaly'] = anomaly_report
        print(f"✅ Detected {anomaly_report.get('total_anomalies', 0)} anomalies")
        print(f"   Health Status: {anomaly_report.get('health_status', 'UNKNOWN')}")

        # Step 2: Incident Prioritization
        print("\n📍 STEP 2/4: Running Incident Prioritization...")
        print("-" * 70)
        incident_report = self.run_incident_prioritization()

        if not incident_report:
            print("❌ Incident prioritization failed. Cannot proceed.")
            return None

        self.reports['incidents'] = incident_report
        print(f"✅ Prioritized {incident_report.get('total_incidents', 0)} incidents")
        p_counts = incident_report.get('priority_counts', {})
        print(f"   P0: {p_counts.get('P0', 0)}, P1: {p_counts.get('P1', 0)}, P2: {p_counts.get('P2', 0)}")

        # Step 3: Fix Suggestions
        print("\n📍 STEP 3/4: Generating Auto-Fix Suggestions...")
        print("-" * 70)
        fix_report = self.run_fix_suggester()

        if not fix_report:
            print("❌ Fix suggestion failed. Cannot proceed.")
            return None

        self.reports['fixes'] = fix_report
        print(f"✅ Generated {fix_report.get('total_automated_fixes', 0)} automated fixes")
        print(f"   Manual fixes: {fix_report.get('total_manual_fixes', 0)}")

        # Step 4: Generate Consolidated Report
        print("\n📍 STEP 4/4: Generating Consolidated Report...")
        print("-" * 70)
        consolidated = self.generate_consolidated_report()

        print("✅ Maintenance analysis complete!")
        print("\n" + "="*70)

        return consolidated

    def run_anomaly_detection(self):
        """Run anomaly detection script"""
        cmd = [
            'python3',
            os.path.join(self.scripts_dir, 'anomaly_detector.py'),
            '--output', 'anomaly-report.json'
        ]

        if self.metrics_file:
            cmd.extend(['--metrics', self.metrics_file])

        if self.logs_file:
            cmd.extend(['--logs', self.logs_file])

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

            # Load generated report
            with open('anomaly-report.json', 'r') as f:
                return json.load(f)

        except Exception as e:
            print(f"Error running anomaly detection: {e}")
            return None

    def run_incident_prioritization(self):
        """Run incident prioritization script"""
        cmd = [
            'python3',
            os.path.join(self.scripts_dir, 'incident_prioritizer.py'),
            '--anomaly-report', 'anomaly-report.json',
            '--output', 'incident-priorities.json'
        ]

        if self.health_report:
            cmd.extend(['--health-report', self.health_report])

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

            # Load generated report
            with open('incident-priorities.json', 'r') as f:
                return json.load(f)

        except Exception as e:
            print(f"Error running incident prioritization: {e}")
            return None

    def run_fix_suggester(self):
        """Run auto-fix suggester script"""
        cmd = [
            'python3',
            os.path.join(self.scripts_dir, 'auto_fix_suggester.py'),
            '--incident-report', 'incident-priorities.json',
            '--output', 'fix-suggestions.json'
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

            # Load generated report
            with open('fix-suggestions.json', 'r') as f:
                return json.load(f)

        except Exception as e:
            print(f"Error running fix suggester: {e}")
            return None

    def generate_consolidated_report(self):
        """Generate consolidated maintenance report"""
        anomaly = self.reports.get('anomaly', {})
        incidents = self.reports.get('incidents', {})
        fixes = self.reports.get('fixes', {})

        # Calculate overall maintenance score
        health_score = anomaly.get('health_score', 50)
        incident_score = self.calculate_incident_impact(incidents)
        fix_coverage = self.calculate_fix_coverage(fixes)

        maintenance_score = (health_score * 0.5) + (incident_score * 0.3) + (fix_coverage * 0.2)

        # Determine maintenance status
        if maintenance_score >= 80:
            status = 'EXCELLENT'
            status_emoji = '🟢'
        elif maintenance_score >= 60:
            status = 'GOOD'
            status_emoji = '🟡'
        elif maintenance_score >= 40:
            status = 'NEEDS_ATTENTION'
            status_emoji = '🟠'
        else:
            status = 'CRITICAL'
            status_emoji = '🔴'

        report = {
            'timestamp': datetime.now().isoformat(),
            'maintenance_score': round(maintenance_score, 2),
            'maintenance_status': status,
            'summary': {
                'anomalies': {
                    'total': anomaly.get('total_anomalies', 0),
                    'critical': anomaly.get('anomalies_by_severity', {}).get('CRITICAL', 0),
                    'health_status': anomaly.get('health_status', 'UNKNOWN')
                },
                'incidents': {
                    'total': incidents.get('total_incidents', 0),
                    'p0': incidents.get('priority_counts', {}).get('P0', 0),
                    'p1': incidents.get('priority_counts', {}).get('P1', 0)
                },
                'fixes': {
                    'automated': fixes.get('total_automated_fixes', 0),
                    'manual': fixes.get('total_manual_fixes', 0)
                }
            },
            'detailed_reports': {
                'anomaly_report': 'anomaly-report.json',
                'incident_report': 'incident-priorities.json',
                'fix_report': 'fix-suggestions.json'
            },
            'action_items': self.generate_action_items(incidents, fixes),
            'recommendations': self.generate_recommendations(status, maintenance_score)
        }

        return report

    def calculate_incident_impact(self, incidents):
        """Calculate score based on incident distribution"""
        p_counts = incidents.get('priority_counts', {})
        total = incidents.get('total_incidents', 0)

        if total == 0:
            return 100

        # Higher severity incidents reduce score more
        score = 100
        score -= p_counts.get('P0', 0) * 30
        score -= p_counts.get('P1', 0) * 20
        score -= p_counts.get('P2', 0) * 10
        score -= p_counts.get('P3', 0) * 5

        return max(score, 0)

    def calculate_fix_coverage(self, fixes):
        """Calculate fix coverage score"""
        total_incidents = fixes.get('total_incidents', 0)
        automated_fixes = fixes.get('total_automated_fixes', 0)

        if total_incidents == 0:
            return 100

        # Better score if more automated fixes available
        coverage_ratio = automated_fixes / total_incidents
        return min(coverage_ratio * 100, 100)

    def generate_action_items(self, incidents, fixes):
        """Generate consolidated action items"""
        items = []

        # Critical incidents
        p0_count = incidents.get('priority_counts', {}).get('P0', 0)
        if p0_count > 0:
            items.append({
                'priority': 'CRITICAL',
                'action': f'Address {p0_count} P0 critical incidents immediately',
                'deadline': '1 hour',
                'automated': True
            })

        # Automated fixes
        execution_plan = fixes.get('execution_plan', {})
        immediate_actions = execution_plan.get('immediate_actions', [])

        if immediate_actions:
            items.append({
                'priority': 'HIGH',
                'action': f'Execute {len(immediate_actions)} automated fixes',
                'deadline': '30 minutes',
                'automated': True
            })

        # High priority incidents
        p1_count = incidents.get('priority_counts', {}).get('P1', 0)
        if p1_count > 0:
            items.append({
                'priority': 'HIGH',
                'action': f'Resolve {p1_count} P1 high priority incidents',
                'deadline': '4 hours',
                'automated': False
            })

        return items

    def generate_recommendations(self, status, score):
        """Generate strategic recommendations"""
        recommendations = []

        if status == 'CRITICAL':
            recommendations.append({
                'category': 'IMMEDIATE',
                'recommendation': 'System requires immediate attention. Execute all automated fixes and mobilize on-call team.',
                'impact': 'HIGH'
            })
        elif status == 'NEEDS_ATTENTION':
            recommendations.append({
                'category': 'URGENT',
                'recommendation': 'Multiple issues detected. Prioritize P0 and P1 incidents for resolution.',
                'impact': 'MEDIUM'
            })

        # Always add preventive recommendations
        recommendations.append({
            'category': 'PREVENTIVE',
            'recommendation': 'Schedule maintenance review to address root causes and prevent future incidents.',
            'impact': 'LONG_TERM'
        })

        recommendations.append({
            'category': 'MONITORING',
            'recommendation': 'Increase monitoring frequency and set up alerting for detected anomaly patterns.',
            'impact': 'MEDIUM'
        })

        return recommendations


def main():
    parser = argparse.ArgumentParser(description='Intelligent Maintenance Orchestrator')
    parser.add_argument('--metrics', help='Path to metrics JSON file')
    parser.add_argument('--logs', help='Path to application logs')
    parser.add_argument('--health-report', help='Path to health monitoring report')
    parser.add_argument('--output', default='maintenance-report.json', help='Output file')

    args = parser.parse_args()

    if not args.metrics and not args.logs and not args.health_report:
        print("Error: At least one input source must be provided (--metrics, --logs, or --health-report)")
        sys.exit(1)

    orchestrator = MaintenanceOrchestrator(args.metrics, args.logs, args.health_report)
    report = orchestrator.orchestrate()

    if not report:
        print("\n❌ Maintenance orchestration failed")
        sys.exit(1)

    # Print consolidated summary
    print("\n" + "="*70)
    print("📊 CONSOLIDATED MAINTENANCE REPORT")
    print("="*70)

    emoji = {'EXCELLENT': '🟢', 'GOOD': '🟡', 'NEEDS_ATTENTION': '🟠', 'CRITICAL': '🔴'}
    status_emoji = emoji.get(report['maintenance_status'], '•')

    print(f"\n{status_emoji} Maintenance Status: {report['maintenance_status']}")
    print(f"   Overall Score: {report['maintenance_score']}/100")

    print("\n📈 Summary:")
    summary = report['summary']
    print(f"   Anomalies: {summary['anomalies']['total']} ({summary['anomalies']['critical']} critical)")
    print(f"   Incidents: {summary['incidents']['total']} ({summary['incidents']['p0']} P0, {summary['incidents']['p1']} P1)")
    print(f"   Fixes Available: {summary['fixes']['automated']} automated, {summary['fixes']['manual']} manual")

    if report['action_items']:
        print("\n⚡ Immediate Actions:")
        for item in report['action_items']:
            priority_emoji = {'CRITICAL': '🔴', 'HIGH': '🟠', 'MEDIUM': '🟡'}
            emoji = priority_emoji.get(item['priority'], '•')
            print(f"   {emoji} [{item['priority']}] {item['action']}")
            print(f"      Deadline: {item['deadline']}")

    if report['recommendations']:
        print("\n💡 Strategic Recommendations:")
        for rec in report['recommendations'][:3]:
            print(f"   • [{rec['category']}] {rec['recommendation']}")

    print("\n📁 Detailed Reports Generated:")
    for key, path in report['detailed_reports'].items():
        print(f"   • {key}: {path}")

    print("="*70)

    # Save consolidated report
    with open(args.output, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n✅ Consolidated report saved to {args.output}\n")

    # Exit with appropriate code
    if report['maintenance_status'] in ['CRITICAL', 'NEEDS_ATTENTION']:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
