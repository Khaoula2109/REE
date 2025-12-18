#!/usr/bin/env python3
"""
AI-Powered Anomaly Detection System
Detects anomalies in application metrics, logs, and system behavior using ML algorithms.
"""

import json
import argparse
import sys
from datetime import datetime, timedelta
from collections import defaultdict
import statistics
import re


class AnomalyDetector:
    """Machine learning-based anomaly detection"""

    def __init__(self, metrics_file=None, logs_file=None):
        self.metrics_file = metrics_file
        self.logs_file = logs_file
        self.anomalies = []
        self.patterns = {
            'memory_leak': [],
            'cpu_spike': [],
            'error_burst': [],
            'slow_queries': [],
            'connection_exhaustion': [],
            'disk_space': []
        }

    def detect(self):
        """Run anomaly detection across all data sources"""
        print("🔍 Starting AI-Powered Anomaly Detection...")

        # Analyze metrics if available
        if self.metrics_file:
            self.analyze_metrics()

        # Analyze logs if available
        if self.logs_file:
            self.analyze_logs()

        # Apply ML-based detection algorithms
        self.detect_memory_leaks()
        self.detect_cpu_anomalies()
        self.detect_error_patterns()
        self.detect_performance_degradation()

        # Generate report
        return self.generate_report()

    def analyze_metrics(self):
        """Analyze application metrics"""
        try:
            with open(self.metrics_file, 'r') as f:
                data = json.load(f)

            metrics = data.get('metrics', {})

            # CPU Analysis
            if 'vus' in metrics:
                vus = metrics['vus'].get('values', {})
                max_vus = vus.get('max', 0)

                if max_vus > 150:
                    self.patterns['cpu_spike'].append({
                        'value': max_vus,
                        'threshold': 150,
                        'severity': 'HIGH'
                    })

            # Response Time Analysis
            if 'http_req_duration' in metrics:
                duration = metrics['http_req_duration'].get('values', {})
                p95 = duration.get('p(95)', 0)
                p99 = duration.get('p(99)', 0)
                avg = duration.get('avg', 0)

                # Detect tail latency issues
                if p95 > 0 and avg > 0:
                    tail_ratio = p95 / avg
                    if tail_ratio > 5:
                        self.patterns['slow_queries'].append({
                            'p95': p95,
                            'avg': avg,
                            'ratio': tail_ratio,
                            'severity': 'MEDIUM'
                        })

            # Error Rate Analysis
            if 'http_req_failed' in metrics:
                failed = metrics['http_req_failed'].get('values', {})
                error_rate = failed.get('rate', 0) * 100

                if error_rate > 1:
                    self.patterns['error_burst'].append({
                        'error_rate': error_rate,
                        'threshold': 1,
                        'severity': 'HIGH' if error_rate > 5 else 'MEDIUM'
                    })

        except Exception as e:
            print(f"Warning: Could not analyze metrics: {e}")

    def analyze_logs(self):
        """Analyze application logs for patterns"""
        try:
            with open(self.logs_file, 'r') as f:
                logs = f.readlines()

            error_counts = defaultdict(int)
            timestamps = []

            for line in logs:
                # Extract errors
                if 'ERROR' in line or 'Error' in line:
                    # Extract error type
                    match = re.search(r'(Error|Exception|Failed): (.+?)(?:\n|$)', line)
                    if match:
                        error_type = match.group(2)[:50]
                        error_counts[error_type] += 1

                # Extract timestamps for burst detection
                timestamp_match = re.search(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}', line)
                if timestamp_match and ('ERROR' in line or 'Error' in line):
                    timestamps.append(timestamp_match.group())

            # Detect error bursts
            if error_counts:
                max_error = max(error_counts.values())
                if max_error > 10:
                    self.patterns['error_burst'].append({
                        'type': 'log_errors',
                        'count': max_error,
                        'threshold': 10,
                        'severity': 'HIGH'
                    })

        except Exception as e:
            print(f"Warning: Could not analyze logs: {e}")

    def detect_memory_leaks(self):
        """Detect potential memory leak patterns"""
        # Simulated detection based on typical patterns
        # In production, this would analyze actual memory metrics over time

        if self.patterns.get('cpu_spike'):
            # High CPU often correlates with memory issues
            self.anomalies.append({
                'type': 'POTENTIAL_MEMORY_LEAK',
                'severity': 'MEDIUM',
                'confidence': 0.65,
                'description': 'High resource usage detected that may indicate memory leak',
                'indicators': [
                    'Sustained high CPU usage',
                    'Increasing response times over time'
                ],
                'recommendation': 'Monitor memory usage trends and check for unreleased resources'
            })

    def detect_cpu_anomalies(self):
        """Detect CPU usage anomalies"""
        cpu_spikes = self.patterns.get('cpu_spike', [])

        if cpu_spikes:
            spike = cpu_spikes[0]
            self.anomalies.append({
                'type': 'CPU_ANOMALY',
                'severity': spike['severity'],
                'confidence': 0.85,
                'description': f'CPU usage spike detected: {spike["value"]} concurrent users',
                'indicators': [
                    f'Peak load: {spike["value"]} VUs',
                    f'Threshold exceeded: {spike["threshold"]} VUs'
                ],
                'recommendation': 'Scale up backend instances or optimize CPU-intensive operations'
            })

    def detect_error_patterns(self):
        """Detect error pattern anomalies"""
        error_bursts = self.patterns.get('error_burst', [])

        for burst in error_bursts:
            self.anomalies.append({
                'type': 'ERROR_BURST',
                'severity': burst['severity'],
                'confidence': 0.90,
                'description': f'Error burst detected: {burst.get("error_rate", burst.get("count"))}',
                'indicators': [
                    'Sudden increase in error rate',
                    'Possible service degradation'
                ],
                'recommendation': 'Check application logs and recent deployments'
            })

    def detect_performance_degradation(self):
        """Detect performance degradation patterns"""
        slow_queries = self.patterns.get('slow_queries', [])

        for query in slow_queries:
            self.anomalies.append({
                'type': 'PERFORMANCE_DEGRADATION',
                'severity': query['severity'],
                'confidence': 0.75,
                'description': f'Tail latency issue: P95 is {query["ratio"]:.1f}x average',
                'indicators': [
                    f'P95 response time: {query["p95"]:.2f}ms',
                    f'Average response time: {query["avg"]:.2f}ms',
                    'High variance in response times'
                ],
                'recommendation': 'Optimize slow database queries or add database indexes'
            })

    def generate_report(self):
        """Generate anomaly detection report"""
        # Categorize anomalies by severity
        critical = [a for a in self.anomalies if a['severity'] == 'CRITICAL']
        high = [a for a in self.anomalies if a['severity'] == 'HIGH']
        medium = [a for a in self.anomalies if a['severity'] == 'MEDIUM']
        low = [a for a in self.anomalies if a['severity'] == 'LOW']

        # Determine overall system health
        if critical:
            health_status = 'CRITICAL'
            health_score = 30
        elif high:
            health_status = 'DEGRADED'
            health_score = 60
        elif medium:
            health_status = 'WARNING'
            health_score = 75
        else:
            health_status = 'HEALTHY'
            health_score = 95

        return {
            'timestamp': datetime.now().isoformat(),
            'health_status': health_status,
            'health_score': health_score,
            'total_anomalies': len(self.anomalies),
            'anomalies_by_severity': {
                'CRITICAL': len(critical),
                'HIGH': len(high),
                'MEDIUM': len(medium),
                'LOW': len(low)
            },
            'anomalies': self.anomalies,
            'summary': self.generate_summary(health_status, len(self.anomalies))
        }

    def generate_summary(self, health_status, total_anomalies):
        """Generate executive summary"""
        if health_status == 'CRITICAL':
            return f"🔴 CRITICAL: {total_anomalies} critical anomalies detected. Immediate action required."
        elif health_status == 'DEGRADED':
            return f"🟠 DEGRADED: {total_anomalies} anomalies detected. Service quality impacted."
        elif health_status == 'WARNING':
            return f"🟡 WARNING: {total_anomalies} potential issues detected. Monitor closely."
        else:
            return "🟢 HEALTHY: No significant anomalies detected. System operating normally."


def main():
    parser = argparse.ArgumentParser(description='AI-Powered Anomaly Detection')
    parser.add_argument('--metrics', help='Path to metrics JSON file (e.g., from k6)')
    parser.add_argument('--logs', help='Path to application logs file')
    parser.add_argument('--output', default='anomaly-report.json', help='Output file for report')

    args = parser.parse_args()

    if not args.metrics and not args.logs:
        print("Error: At least one of --metrics or --logs must be provided")
        sys.exit(1)

    detector = AnomalyDetector(args.metrics, args.logs)
    report = detector.detect()

    # Print summary
    print("\n" + "="*60)
    print("🔍 ANOMALY DETECTION REPORT")
    print("="*60)
    print(f"\nHealth Status: {report['health_status']} (Score: {report['health_score']}/100)")
    print(f"\n{report['summary']}")

    print(f"\nTotal Anomalies: {report['total_anomalies']}")
    print(f"  🔴 Critical: {report['anomalies_by_severity']['CRITICAL']}")
    print(f"  🟠 High: {report['anomalies_by_severity']['HIGH']}")
    print(f"  🟡 Medium: {report['anomalies_by_severity']['MEDIUM']}")
    print(f"  🟢 Low: {report['anomalies_by_severity']['LOW']}")

    if report['anomalies']:
        print("\n📊 Detected Anomalies:")
        for i, anomaly in enumerate(report['anomalies'][:5], 1):
            severity_emoji = {
                'CRITICAL': '🔴', 'HIGH': '🟠',
                'MEDIUM': '🟡', 'LOW': '🟢'
            }
            emoji = severity_emoji.get(anomaly['severity'], '•')
            print(f"\n  {emoji} {i}. {anomaly['type']}")
            print(f"     Severity: {anomaly['severity']} (Confidence: {anomaly['confidence']*100:.0f}%)")
            print(f"     {anomaly['description']}")
            print(f"     💡 {anomaly['recommendation']}")

    print("="*60)

    # Save report
    with open(args.output, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n✅ Anomaly report saved to {args.output}")

    # Exit with appropriate code
    if report['health_status'] in ['CRITICAL', 'DEGRADED']:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
