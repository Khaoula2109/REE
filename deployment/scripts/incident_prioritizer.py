#!/usr/bin/env python3
"""
AI-Powered Incident Prioritization System
Intelligently prioritizes incidents based on severity, impact, and business criticality.
"""

import json
import argparse
import sys
from datetime import datetime


class IncidentPrioritizer:
    """AI-powered incident prioritization engine"""

    def __init__(self, anomaly_report_path=None, health_report_path=None):
        self.anomaly_report = self.load_report(anomaly_report_path) if anomaly_report_path else None
        self.health_report = self.load_report(health_report_path) if health_report_path else None
        self.incidents = []

    def load_report(self, filepath):
        """Load report from JSON file"""
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load report {filepath}: {e}")
            return None

    def prioritize(self):
        """Analyze and prioritize all incidents"""
        print("🎯 Starting AI-Powered Incident Prioritization...")

        # Extract incidents from reports
        self.extract_incidents_from_anomalies()
        self.extract_incidents_from_health()

        # Calculate priority scores
        for incident in self.incidents:
            incident['priority_score'] = self.calculate_priority_score(incident)
            incident['priority_level'] = self.determine_priority_level(incident['priority_score'])
            incident['sla_deadline'] = self.calculate_sla_deadline(incident)

        # Sort by priority score (highest first)
        self.incidents.sort(key=lambda x: x['priority_score'], reverse=True)

        # Generate prioritization report
        return self.generate_report()

    def extract_incidents_from_anomalies(self):
        """Extract incidents from anomaly report"""
        if not self.anomaly_report:
            return

        anomalies = self.anomaly_report.get('anomalies', [])

        for anomaly in anomalies:
            self.incidents.append({
                'id': f"AN-{len(self.incidents) + 1:04d}",
                'type': 'ANOMALY',
                'title': anomaly['type'].replace('_', ' ').title(),
                'description': anomaly['description'],
                'severity': anomaly['severity'],
                'confidence': anomaly.get('confidence', 0.5),
                'source': 'Anomaly Detector',
                'indicators': anomaly.get('indicators', []),
                'recommendation': anomaly.get('recommendation', 'Investigate immediately'),
                'timestamp': datetime.now().isoformat()
            })

    def extract_incidents_from_health(self):
        """Extract incidents from health monitoring report"""
        if not self.health_report:
            return

        # Check overall health
        overall_health = self.health_report.get('overall_health', 'UNKNOWN')

        if overall_health in ['POOR', 'DEGRADED']:
            self.incidents.append({
                'id': f"HM-{len(self.incidents) + 1:04d}",
                'type': 'HEALTH',
                'title': f'System Health {overall_health}',
                'description': f'Overall system health is {overall_health}',
                'severity': 'HIGH' if overall_health == 'POOR' else 'MEDIUM',
                'confidence': 1.0,
                'source': 'Health Monitor',
                'indicators': [
                    f"Uptime: {self.health_report.get('uptime_percentage', 0)}%",
                    f"Failed checks: {self.health_report.get('total_checks', 0) - self.health_report.get('healthy_checks', 0)}"
                ],
                'recommendation': self.health_report.get('recommendation', 'Investigate system health'),
                'timestamp': datetime.now().isoformat()
            })

        # Check for anomalies in health report
        anomalies = self.health_report.get('anomalies', [])
        for anomaly in anomalies[:3]:  # Top 3 anomalies
            self.incidents.append({
                'id': f"HM-{len(self.incidents) + 1:04d}",
                'type': 'HEALTH_ANOMALY',
                'title': anomaly.get('type', 'Health Anomaly'),
                'description': anomaly.get('message', 'Health check anomaly detected'),
                'severity': anomaly.get('severity', 'MEDIUM'),
                'confidence': 0.8,
                'source': 'Health Monitor',
                'indicators': [],
                'recommendation': 'Check application health and logs',
                'timestamp': anomaly.get('timestamp', datetime.now().isoformat())
            })

    def calculate_priority_score(self, incident):
        """Calculate priority score (0-100)"""
        score = 0

        # Severity weight (40 points max)
        severity_scores = {
            'CRITICAL': 40,
            'HIGH': 30,
            'MEDIUM': 20,
            'LOW': 10
        }
        score += severity_scores.get(incident.get('severity', 'MEDIUM'), 20)

        # Confidence weight (20 points max)
        confidence = incident.get('confidence', 0.5)
        score += int(confidence * 20)

        # Business impact weight (20 points max)
        impact_scores = {
            'ANOMALY': 15,  # Direct system issues
            'HEALTH': 18,   # System-wide health
            'HEALTH_ANOMALY': 12
        }
        score += impact_scores.get(incident.get('type', 'ANOMALY'), 10)

        # Recency weight (10 points max)
        # Recent incidents get higher priority
        score += 10  # Assume all are recent for now

        # Number of indicators weight (10 points max)
        indicators = incident.get('indicators', [])
        indicator_score = min(len(indicators) * 2, 10)
        score += indicator_score

        return min(score, 100)

    def determine_priority_level(self, score):
        """Determine priority level from score"""
        if score >= 80:
            return 'P0 - CRITICAL'
        elif score >= 65:
            return 'P1 - HIGH'
        elif score >= 45:
            return 'P2 - MEDIUM'
        elif score >= 25:
            return 'P3 - LOW'
        else:
            return 'P4 - TRIVIAL'

    def calculate_sla_deadline(self, incident):
        """Calculate SLA deadline based on priority"""
        priority_level = incident.get('priority_level', 'P3')

        if 'P0' in priority_level:
            hours = 1
        elif 'P1' in priority_level:
            hours = 4
        elif 'P2' in priority_level:
            hours = 24
        elif 'P3' in priority_level:
            hours = 72
        else:
            hours = 168  # 1 week

        deadline = datetime.now().timestamp() + (hours * 3600)
        return {
            'hours': hours,
            'deadline_iso': datetime.fromtimestamp(deadline).isoformat(),
            'deadline_human': f"{hours}h from now"
        }

    def generate_report(self):
        """Generate prioritization report"""
        # Count by priority
        priority_counts = {
            'P0': len([i for i in self.incidents if 'P0' in i.get('priority_level', '')]),
            'P1': len([i for i in self.incidents if 'P1' in i.get('priority_level', '')]),
            'P2': len([i for i in self.incidents if 'P2' in i.get('priority_level', '')]),
            'P3': len([i for i in self.incidents if 'P3' in i.get('priority_level', '')]),
            'P4': len([i for i in self.incidents if 'P4' in i.get('priority_level', '')])
        }

        # Generate action plan
        action_plan = self.generate_action_plan()

        return {
            'timestamp': datetime.now().isoformat(),
            'total_incidents': len(self.incidents),
            'priority_counts': priority_counts,
            'incidents': self.incidents,
            'action_plan': action_plan,
            'summary': self.generate_summary(priority_counts)
        }

    def generate_action_plan(self):
        """Generate recommended action plan"""
        actions = []

        # Group by priority
        p0_incidents = [i for i in self.incidents if 'P0' in i.get('priority_level', '')]
        p1_incidents = [i for i in self.incidents if 'P1' in i.get('priority_level', '')]

        if p0_incidents:
            actions.append({
                'priority': 'IMMEDIATE',
                'action': 'Address all P0 critical incidents',
                'incidents': [i['id'] for i in p0_incidents],
                'deadline': '1 hour',
                'team': 'On-call engineer + Manager'
            })

        if p1_incidents:
            actions.append({
                'priority': 'URGENT',
                'action': 'Resolve all P1 high priority incidents',
                'incidents': [i['id'] for i in p1_incidents],
                'deadline': '4 hours',
                'team': 'On-call engineer'
            })

        # Add preventive actions
        if self.incidents:
            actions.append({
                'priority': 'PREVENTIVE',
                'action': 'Schedule incident review meeting',
                'incidents': [],
                'deadline': '24 hours',
                'team': 'Engineering team'
            })

        return actions

    def generate_summary(self, priority_counts):
        """Generate executive summary"""
        total = sum(priority_counts.values())

        if priority_counts['P0'] > 0:
            return f"🔴 CRITICAL: {priority_counts['P0']} P0 incidents require immediate attention!"
        elif priority_counts['P1'] > 0:
            return f"🟠 URGENT: {priority_counts['P1']} P1 incidents need resolution within 4 hours"
        elif priority_counts['P2'] > 0:
            return f"🟡 ATTENTION: {priority_counts['P2']} P2 incidents to address today"
        elif total > 0:
            return f"🟢 NORMAL: {total} low-priority incidents in backlog"
        else:
            return "✅ CLEAR: No incidents to prioritize"


def main():
    parser = argparse.ArgumentParser(description='AI-Powered Incident Prioritization')
    parser.add_argument('--anomaly-report', help='Path to anomaly detection report')
    parser.add_argument('--health-report', help='Path to health monitoring report')
    parser.add_argument('--output', default='incident-priorities.json', help='Output file')

    args = parser.parse_args()

    if not args.anomaly_report and not args.health_report:
        print("Error: At least one report must be provided (--anomaly-report or --health-report)")
        sys.exit(1)

    prioritizer = IncidentPrioritizer(args.anomaly_report, args.health_report)
    report = prioritizer.prioritize()

    # Print summary
    print("\n" + "="*60)
    print("🎯 INCIDENT PRIORITIZATION REPORT")
    print("="*60)

    print(f"\n{report['summary']}")
    print(f"\nTotal Incidents: {report['total_incidents']}")

    print("\n📊 Priority Distribution:")
    for priority, count in report['priority_counts'].items():
        if count > 0:
            emoji = {'P0': '🔴', 'P1': '🟠', 'P2': '🟡', 'P3': '🟢', 'P4': '⚪'}
            print(f"  {emoji.get(priority, '•')} {priority}: {count} incidents")

    if report['action_plan']:
        print("\n📋 Recommended Actions:")
        for i, action in enumerate(report['action_plan'], 1):
            print(f"\n  {i}. [{action['priority']}] {action['action']}")
            print(f"     Team: {action['team']}")
            print(f"     Deadline: {action['deadline']}")
            if action['incidents']:
                print(f"     Incidents: {', '.join(action['incidents'])}")

    if report['incidents']:
        print("\n🔝 Top Priority Incidents:")
        for incident in report['incidents'][:5]:
            print(f"\n  {incident['id']} - {incident['title']}")
            print(f"  Priority: {incident['priority_level']} (Score: {incident['priority_score']})")
            print(f"  SLA: {incident['sla_deadline']['deadline_human']}")
            print(f"  💡 {incident['recommendation']}")

    print("="*60)

    # Save report
    with open(args.output, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n✅ Prioritization report saved to {args.output}")

    # Exit with appropriate code
    if report['priority_counts']['P0'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
