#!/usr/bin/env python3
"""
Post-Deployment Health Monitoring
Continuously monitors application health after deployment and detects anomalies.
"""

import json
import argparse
import time
import sys
from datetime import datetime
import urllib.request
import urllib.error


class HealthMonitor:
    """Post-deployment health monitoring and anomaly detection"""

    def __init__(self, base_url, duration=300, interval=30):
        self.base_url = base_url
        self.duration = duration
        self.interval = interval
        self.health_checks = []
        self.anomalies = []

    def monitor(self):
        """Monitor application health"""
        print(f"🏥 Starting health monitoring for {self.duration}s...")
        print(f"   Base URL: {self.base_url}")
        print(f"   Check interval: {self.interval}s\n")

        start_time = time.time()
        check_count = 0

        while time.time() - start_time < self.duration:
            check_count += 1
            print(f"[Check {check_count}] {datetime.now().strftime('%H:%M:%S')}")

            # Perform health checks
            health_status = self.check_health()
            self.health_checks.append(health_status)

            # Print status
            self.print_status(health_status)

            # Detect anomalies
            self.detect_anomalies(health_status)

            # Wait for next interval
            time.sleep(self.interval)

        # Generate final report
        return self.generate_report()

    def check_health(self):
        """Perform health check"""
        timestamp = datetime.now().isoformat()
        status = {
            "timestamp": timestamp,
            "checks": {}
        }

        # Check main health endpoint
        status['checks']['api_health'] = self.check_endpoint(f"{self.base_url}/api/health")

        # Check authentication endpoint (POST with empty body)
        status['checks']['auth_available'] = self.check_endpoint(
            f"{self.base_url}/api/auth/login",
            method='POST',
            expect_status=[400, 422]  # Empty body should return validation error
        )

        # Check backoffice API - readings endpoint
        status['checks']['backoffice_api'] = self.check_endpoint(f"{self.base_url}/api/readings", expect_status=[401])

        # Overall health
        all_checks = list(status['checks'].values())
        status['overall'] = 'healthy' if all(c['healthy'] for c in all_checks) else 'unhealthy'

        return status

    def check_endpoint(self, url, method='GET', expect_status=None, timeout=10):
        """Check individual endpoint"""
        if expect_status is None:
            expect_status = [200]

        try:
            req = urllib.request.Request(url, method=method)

            # Add empty JSON body for POST requests
            if method == 'POST':
                req.add_header('Content-Type', 'application/json')
                data = b'{}'
                req.data = data

            start_time = time.time()

            try:
                response = urllib.request.urlopen(req, timeout=timeout)
                status_code = response.getcode()
            except urllib.error.HTTPError as e:
                status_code = e.code

            response_time = (time.time() - start_time) * 1000  # Convert to ms

            return {
                "healthy": status_code in expect_status,
                "status_code": status_code,
                "response_time_ms": round(response_time, 2),
                "error": None
            }

        except urllib.error.URLError as e:
            return {
                "healthy": False,
                "status_code": None,
                "response_time_ms": None,
                "error": str(e.reason)
            }
        except Exception as e:
            return {
                "healthy": False,
                "status_code": None,
                "response_time_ms": None,
                "error": str(e)
            }

    def print_status(self, health_status):
        """Print current health status"""
        overall = health_status['overall']
        emoji = "✅" if overall == 'healthy' else "❌"

        print(f"  Status: {emoji} {overall.upper()}")

        for check_name, check_result in health_status['checks'].items():
            status_emoji = "✅" if check_result['healthy'] else "❌"
            status_code = check_result.get('status_code', 'N/A')
            response_time = check_result.get('response_time_ms')

            if response_time:
                print(f"    {status_emoji} {check_name}: {status_code} ({response_time:.0f}ms)")
            else:
                error = check_result.get('error', 'Unknown error')
                print(f"    {status_emoji} {check_name}: {error}")

        print()

    def detect_anomalies(self, health_status):
        """Detect anomalies in health check results"""
        # Check for failures
        if health_status['overall'] == 'unhealthy':
            self.anomalies.append({
                "timestamp": health_status['timestamp'],
                "type": "SERVICE_UNHEALTHY",
                "severity": "CRITICAL",
                "message": "One or more health checks failed"
            })

        # Check for slow response times
        for check_name, check_result in health_status['checks'].items():
            response_time = check_result.get('response_time_ms')

            if response_time and response_time > 1000:
                self.anomalies.append({
                    "timestamp": health_status['timestamp'],
                    "type": "SLOW_RESPONSE",
                    "severity": "WARNING",
                    "message": f"{check_name} is slow ({response_time:.0f}ms)"
                })

    def generate_report(self):
        """Generate final health report"""
        if not self.health_checks:
            return {"error": "No health checks performed"}

        # Calculate statistics
        total_checks = len(self.health_checks)
        healthy_checks = sum(1 for check in self.health_checks if check['overall'] == 'healthy')
        uptime_percentage = (healthy_checks / total_checks) * 100

        # Calculate average response times
        response_times = {}
        for check in self.health_checks:
            for check_name, check_result in check['checks'].items():
                if check_result.get('response_time_ms'):
                    if check_name not in response_times:
                        response_times[check_name] = []
                    response_times[check_name].append(check_result['response_time_ms'])

        avg_response_times = {}
        for check_name, times in response_times.items():
            avg_response_times[check_name] = {
                "avg_ms": round(sum(times) / len(times), 2),
                "min_ms": round(min(times), 2),
                "max_ms": round(max(times), 2)
            }

        # Determine overall health
        if uptime_percentage >= 99:
            overall_health = "EXCELLENT"
        elif uptime_percentage >= 95:
            overall_health = "GOOD"
        elif uptime_percentage >= 90:
            overall_health = "DEGRADED"
        else:
            overall_health = "POOR"

        return {
            "monitoring_duration_seconds": self.duration,
            "total_checks": total_checks,
            "healthy_checks": healthy_checks,
            "uptime_percentage": round(uptime_percentage, 2),
            "overall_health": overall_health,
            "response_times": avg_response_times,
            "anomalies": self.anomalies,
            "recommendation": self.generate_recommendation(overall_health, uptime_percentage)
        }

    def generate_recommendation(self, overall_health, uptime_percentage):
        """Generate recommendation based on monitoring results"""
        if overall_health == "EXCELLENT":
            return "✅ Deployment successful. System is operating normally."
        elif overall_health == "GOOD":
            return "✅ Deployment successful. Minor performance issues detected - continue monitoring."
        elif overall_health == "DEGRADED":
            return "⚠️ Deployment partially successful. Performance degradation detected - investigate immediately."
        else:
            return "❌ Deployment failed. Critical issues detected - consider rollback."


def main():
    parser = argparse.ArgumentParser(description='Post-Deployment Health Monitoring')
    parser.add_argument('--url', default='http://localhost:5001', help='Base URL to monitor')
    parser.add_argument('--duration', type=int, default=300, help='Monitoring duration in seconds')
    parser.add_argument('--interval', type=int, default=30, help='Check interval in seconds')
    parser.add_argument('--output', default='health-report.json', help='Output file for health report')

    args = parser.parse_args()

    monitor = HealthMonitor(args.url, args.duration, args.interval)

    try:
        report = monitor.monitor()

        # Print summary
        print("\n" + "="*60)
        print("🏥 HEALTH MONITORING REPORT")
        print("="*60)
        print(f"\nOverall Health: {report['overall_health']}")
        print(f"Uptime: {report['uptime_percentage']:.2f}%")
        print(f"Total Checks: {report['total_checks']}")
        print(f"Healthy Checks: {report['healthy_checks']}")

        print("\n📊 Average Response Times:")
        for check_name, times in report['response_times'].items():
            print(f"  {check_name}:")
            print(f"    Avg: {times['avg_ms']:.0f}ms")
            print(f"    Min: {times['min_ms']:.0f}ms")
            print(f"    Max: {times['max_ms']:.0f}ms")

        if report['anomalies']:
            print(f"\n⚠️ Anomalies Detected: {len(report['anomalies'])}")
            for anomaly in report['anomalies'][:5]:  # Show first 5
                print(f"  [{anomaly['severity']}] {anomaly['type']}: {anomaly['message']}")

        print(f"\n{report['recommendation']}")
        print("="*60)

        # Save report
        with open(args.output, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"\n✅ Health report saved to {args.output}")

        # Exit with appropriate code
        if report['overall_health'] in ['POOR', 'DEGRADED']:
            sys.exit(1)
        else:
            sys.exit(0)

    except KeyboardInterrupt:
        print("\n\n⚠️ Monitoring interrupted by user")
        sys.exit(1)


if __name__ == '__main__':
    main()
