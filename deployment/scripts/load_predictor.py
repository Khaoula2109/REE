#!/usr/bin/env python3
"""
AI-Powered Load Testing Predictor
Analyzes load test results and predicts system behavior under various loads.
"""

import json
import argparse
from datetime import datetime, timedelta
import sys
import math


class LoadPredictor:
    """AI-powered load prediction and capacity planning"""

    def __init__(self, results_file):
        self.results = self.load_results(results_file)
        self.predictions = {}

    def load_results(self, filepath):
        """Load k6 test results"""
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading results: {e}")
            sys.exit(1)

    def analyze(self):
        """Perform complete load analysis and prediction"""
        print("🤖 Starting AI-Powered Load Prediction...")

        # Extract key metrics
        metrics = self.extract_metrics()

        # Predict capacity limits
        capacity = self.predict_capacity(metrics)

        # Predict performance degradation
        degradation = self.predict_degradation(metrics)

        # Resource recommendations
        recommendations = self.generate_recommendations(metrics, capacity)

        # Anomaly detection
        anomalies = self.detect_anomalies(metrics)

        return {
            "timestamp": datetime.now().isoformat(),
            "metrics": metrics,
            "capacity_prediction": capacity,
            "degradation_analysis": degradation,
            "recommendations": recommendations,
            "anomalies": anomalies,
            "summary": self.generate_summary(metrics, capacity)
        }

    def extract_metrics(self):
        """Extract key performance metrics"""
        metrics_data = self.results.get('metrics', {})

        extracted = {
            "total_requests": 0,
            "failed_requests": 0,
            "avg_response_time": 0,
            "p95_response_time": 0,
            "p99_response_time": 0,
            "max_response_time": 0,
            "min_response_time": 0,
            "error_rate": 0,
            "requests_per_second": 0,
            "data_received": 0,
            "data_sent": 0,
            "vus": 0,
            "iterations": 0
        }

        # Extract HTTP request metrics
        if 'http_reqs' in metrics_data:
            extracted['total_requests'] = metrics_data['http_reqs']['values'].get('count', 0)
            extracted['requests_per_second'] = metrics_data['http_reqs']['values'].get('rate', 0)

        # Extract response time metrics
        if 'http_req_duration' in metrics_data:
            duration = metrics_data['http_req_duration']['values']
            extracted['avg_response_time'] = duration.get('avg', 0)
            extracted['p95_response_time'] = duration.get('p(95)', 0)
            extracted['p99_response_time'] = duration.get('p(99)', 0)
            extracted['max_response_time'] = duration.get('max', 0)
            extracted['min_response_time'] = duration.get('min', 0)

        # Extract failure metrics
        if 'http_req_failed' in metrics_data:
            failed = metrics_data['http_req_failed']['values']
            extracted['failed_requests'] = failed.get('passes', 0)
            extracted['error_rate'] = failed.get('rate', 0) * 100

        # Extract VU metrics
        if 'vus' in metrics_data:
            extracted['vus'] = metrics_data['vus']['values'].get('max', 0)

        # Extract iteration metrics
        if 'iterations' in metrics_data:
            extracted['iterations'] = metrics_data['iterations']['values'].get('count', 0)

        return extracted

    def predict_capacity(self, metrics):
        """Predict system capacity and breaking point"""
        # Simple AI model based on response time growth

        avg_rt = metrics['avg_response_time']
        p95_rt = metrics['p95_response_time']
        error_rate = metrics['error_rate']
        current_vus = metrics['vus']
        rps = metrics['requests_per_second']

        # Calculate response time growth rate
        if avg_rt > 0:
            rt_variance = (p95_rt - avg_rt) / avg_rt
        else:
            rt_variance = 0

        # Predict maximum capacity
        # Based on: when p95 > 1000ms or error rate > 5%

        if error_rate > 5 or p95_rt > 1000:
            # System is already at or over capacity
            max_vus = current_vus
            max_rps = rps
            status = "AT_CAPACITY"
            confidence = 0.85
        elif rt_variance > 0.5:
            # High variance indicates approaching limits
            # Estimate 20-30% more capacity
            max_vus = int(current_vus * 1.25)
            max_rps = rps * 1.25
            status = "APPROACHING_LIMIT"
            confidence = 0.75
        else:
            # System performing well, estimate 2x capacity
            max_vus = int(current_vus * 2)
            max_rps = rps * 2
            status = "HEALTHY"
            confidence = 0.70

        return {
            "current_users": current_vus,
            "max_users_predicted": max_vus,
            "current_rps": round(rps, 2),
            "max_rps_predicted": round(max_rps, 2),
            "capacity_utilization": round((current_vus / max_vus) * 100, 2) if max_vus > 0 else 0,
            "status": status,
            "confidence": confidence,
            "headroom_percentage": round(((max_vus - current_vus) / max_vus) * 100, 2) if max_vus > 0 else 0
        }

    def predict_degradation(self, metrics):
        """Predict performance degradation patterns"""

        avg_rt = metrics['avg_response_time']
        p95_rt = metrics['p95_response_time']
        p99_rt = metrics['p99_response_time']

        # Calculate degradation at different percentiles
        p95_degradation = ((p95_rt - avg_rt) / avg_rt * 100) if avg_rt > 0 else 0
        p99_degradation = ((p99_rt - avg_rt) / avg_rt * 100) if avg_rt > 0 else 0

        # Classify degradation severity
        if p95_degradation > 100:
            severity = "SEVERE"
            description = "Significant performance degradation at tail latencies"
        elif p95_degradation > 50:
            severity = "MODERATE"
            description = "Noticeable performance degradation for some users"
        elif p95_degradation > 25:
            severity = "MILD"
            description = "Minor performance degradation at high percentiles"
        else:
            severity = "MINIMAL"
            description = "Consistent performance across all users"

        return {
            "severity": severity,
            "description": description,
            "p95_degradation_pct": round(p95_degradation, 2),
            "p99_degradation_pct": round(p99_degradation, 2),
            "consistency_score": self.calculate_consistency_score(metrics)
        }

    def calculate_consistency_score(self, metrics):
        """Calculate how consistent performance is (0-100)"""
        avg_rt = metrics['avg_response_time']
        max_rt = metrics['max_response_time']

        if avg_rt == 0:
            return 100

        # Lower variance = higher consistency
        variance_ratio = avg_rt / max_rt if max_rt > 0 else 1
        consistency = int(variance_ratio * 100)

        return min(consistency, 100)

    def generate_recommendations(self, metrics, capacity):
        """Generate infrastructure recommendations"""
        recommendations = []

        # Check capacity headroom
        headroom = capacity.get('headroom_percentage', 0)
        if headroom < 20:
            recommendations.append({
                "priority": "HIGH",
                "category": "Scaling",
                "recommendation": "Scale up infrastructure immediately - less than 20% capacity headroom",
                "action": "Increase server instances by 50-100%"
            })
        elif headroom < 40:
            recommendations.append({
                "priority": "MEDIUM",
                "category": "Scaling",
                "recommendation": "Plan for scaling - approaching capacity limits",
                "action": "Prepare to increase server instances by 25-50%"
            })

        # Check response times
        p95_rt = metrics.get('p95_response_time', 0)
        if p95_rt > 1000:
            recommendations.append({
                "priority": "HIGH",
                "category": "Performance",
                "recommendation": "P95 response time exceeds 1 second",
                "action": "Optimize slow endpoints, add caching, or scale database"
            })
        elif p95_rt > 500:
            recommendations.append({
                "priority": "MEDIUM",
                "category": "Performance",
                "recommendation": "P95 response time approaching threshold",
                "action": "Review and optimize slow queries"
            })

        # Check error rate
        error_rate = metrics.get('error_rate', 0)
        if error_rate > 5:
            recommendations.append({
                "priority": "CRITICAL",
                "category": "Reliability",
                "recommendation": f"High error rate detected ({error_rate:.2f}%)",
                "action": "Investigate errors immediately and add circuit breakers"
            })
        elif error_rate > 1:
            recommendations.append({
                "priority": "MEDIUM",
                "category": "Reliability",
                "recommendation": f"Elevated error rate ({error_rate:.2f}%)",
                "action": "Review error logs and add retry logic"
            })

        # Resource optimization
        if metrics.get('avg_response_time', 0) < 100 and headroom > 60:
            recommendations.append({
                "priority": "LOW",
                "category": "Optimization",
                "recommendation": "System is over-provisioned",
                "action": "Consider reducing resources to optimize costs"
            })

        if not recommendations:
            recommendations.append({
                "priority": "INFO",
                "category": "Status",
                "recommendation": "System performing well within parameters",
                "action": "Continue monitoring and maintain current configuration"
            })

        return recommendations

    def detect_anomalies(self, metrics):
        """Detect anomalies in load test results"""
        anomalies = []

        # Check for response time spikes
        avg_rt = metrics.get('avg_response_time', 0)
        max_rt = metrics.get('max_response_time', 0)

        if max_rt > avg_rt * 10:
            anomalies.append({
                "type": "RESPONSE_TIME_SPIKE",
                "severity": "WARNING",
                "description": f"Max response time ({max_rt:.0f}ms) is 10x average ({avg_rt:.0f}ms)",
                "recommendation": "Investigate slow queries or resource contention"
            })

        # Check for high variance
        p95_rt = metrics.get('p95_response_time', 0)
        if avg_rt > 0 and (p95_rt / avg_rt) > 3:
            anomalies.append({
                "type": "HIGH_VARIANCE",
                "severity": "WARNING",
                "description": "Large variance between average and P95 response times",
                "recommendation": "Inconsistent performance - investigate outliers"
            })

        # Check for unusual error patterns
        error_rate = metrics.get('error_rate', 0)
        if 0 < error_rate < 1:
            anomalies.append({
                "type": "INTERMITTENT_ERRORS",
                "severity": "INFO",
                "description": f"Low but non-zero error rate ({error_rate:.2f}%)",
                "recommendation": "Monitor for patterns in error occurrences"
            })

        return anomalies

    def generate_summary(self, metrics, capacity):
        """Generate executive summary"""
        status = capacity.get('status', 'UNKNOWN')
        headroom = capacity.get('headroom_percentage', 0)
        error_rate = metrics.get('error_rate', 0)

        if status == "AT_CAPACITY" or error_rate > 5:
            health = "CRITICAL"
            message = "System is at or over capacity. Immediate action required."
        elif status == "APPROACHING_LIMIT" or headroom < 30:
            health = "WARNING"
            message = "System approaching capacity limits. Plan for scaling."
        else:
            health = "HEALTHY"
            message = "System performing within acceptable parameters."

        return {
            "health": health,
            "message": message,
            "key_metrics": {
                "avg_response_time_ms": round(metrics.get('avg_response_time', 0), 2),
                "p95_response_time_ms": round(metrics.get('p95_response_time', 0), 2),
                "error_rate_pct": round(error_rate, 2),
                "capacity_utilization_pct": capacity.get('capacity_utilization', 0)
            }
        }


def main():
    parser = argparse.ArgumentParser(description='AI-Powered Load Test Predictor')
    parser.add_argument('--results', required=True, help='Path to k6 results JSON file')
    parser.add_argument('--output', default='load-predictions.json', help='Output file for predictions')

    args = parser.parse_args()

    predictor = LoadPredictor(args.results)
    predictions = predictor.analyze()

    # Print summary
    print("\n" + "="*60)
    print("📊 LOAD TEST PREDICTIONS")
    print("="*60)

    summary = predictions['summary']
    print(f"\nHealth Status: {summary['health']}")
    print(f"Message: {summary['message']}\n")

    print("Key Metrics:")
    for key, value in summary['key_metrics'].items():
        print(f"  • {key}: {value}")

    capacity = predictions['capacity_prediction']
    print(f"\nCapacity Analysis:")
    print(f"  • Current: {capacity['current_users']} users @ {capacity['current_rps']:.2f} req/s")
    print(f"  • Predicted Max: {capacity['max_users_predicted']} users @ {capacity['max_rps_predicted']:.2f} req/s")
    print(f"  • Headroom: {capacity['headroom_percentage']:.1f}%")
    print(f"  • Confidence: {capacity['confidence']*100:.0f}%")

    print(f"\nRecommendations:")
    for rec in predictions['recommendations']:
        priority_emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🟢", "INFO": "ℹ️"}
        emoji = priority_emoji.get(rec['priority'], "•")
        print(f"  {emoji} [{rec['priority']}] {rec['recommendation']}")
        print(f"     Action: {rec['action']}")

    if predictions['anomalies']:
        print(f"\nAnomalies Detected:")
        for anomaly in predictions['anomalies']:
            print(f"  ⚠️ {anomaly['type']}: {anomaly['description']}")

    print("="*60)

    # Save predictions
    with open(args.output, 'w') as f:
        json.dump(predictions, f, indent=2)

    print(f"\n✅ Predictions saved to {args.output}")

    # Exit with appropriate code
    if summary['health'] == 'CRITICAL':
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
