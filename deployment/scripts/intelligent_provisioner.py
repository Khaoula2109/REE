#!/usr/bin/env python3
"""
Intelligent Environment Provisioning Agent
Uses AI to automatically provision and configure deployment environments based on
load predictions, risk assessments, and historical data.
"""

import json
import argparse
import sys
from datetime import datetime
import os


class IntelligentProvisioner:
    """AI-powered environment provisioning and configuration"""

    def __init__(self, environment, risk_report_path=None):
        self.environment = environment
        self.risk_report = self.load_risk_report(risk_report_path) if risk_report_path else None
        self.provision_plan = {
            "environment": environment,
            "timestamp": datetime.now().isoformat(),
            "resources": {},
            "configuration": {},
            "monitoring": {},
            "scaling": {}
        }

    def load_risk_report(self, filepath):
        """Load risk assessment report"""
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load risk report: {e}")
            return None

    def provision(self):
        """Create intelligent provisioning plan"""
        print(f"🤖 Provisioning {self.environment} environment with AI optimization...")

        # Determine base configuration
        base_config = self.get_base_configuration()

        # Apply risk-based adjustments
        if self.risk_report:
            base_config = self.apply_risk_adjustments(base_config)

        # Configure resources
        self.configure_compute_resources(base_config)
        self.configure_database(base_config)
        self.configure_caching(base_config)
        self.configure_networking(base_config)

        # Setup monitoring
        self.setup_monitoring(base_config)

        # Configure auto-scaling
        self.configure_autoscaling(base_config)

        # Generate deployment configuration
        self.generate_deployment_config()

        return self.provision_plan

    def get_base_configuration(self):
        """Get base configuration for environment"""
        configs = {
            "development": {
                "compute": {
                    "backend_instances": 1,
                    "backend_cpu": "1 vCPU",
                    "backend_memory": "2 GB",
                    "frontend_instances": 1,
                },
                "database": {
                    "instance_type": "db.t3.small",
                    "storage_gb": 20,
                    "backup_enabled": False,
                },
                "redis": {
                    "instance_type": "cache.t3.micro",
                    "memory_gb": 0.5,
                },
                "monitoring": {
                    "metrics_retention_days": 7,
                    "detailed_monitoring": False,
                },
                "scaling": {
                    "auto_scaling_enabled": False,
                }
            },
            "staging": {
                "compute": {
                    "backend_instances": 2,
                    "backend_cpu": "2 vCPU",
                    "backend_memory": "4 GB",
                    "frontend_instances": 1,
                },
                "database": {
                    "instance_type": "db.t3.medium",
                    "storage_gb": 50,
                    "backup_enabled": True,
                    "backup_retention_days": 7,
                },
                "redis": {
                    "instance_type": "cache.t3.small",
                    "memory_gb": 1.5,
                },
                "monitoring": {
                    "metrics_retention_days": 30,
                    "detailed_monitoring": True,
                },
                "scaling": {
                    "auto_scaling_enabled": True,
                    "min_instances": 1,
                    "max_instances": 4,
                }
            },
            "production": {
                "compute": {
                    "backend_instances": 3,
                    "backend_cpu": "4 vCPU",
                    "backend_memory": "8 GB",
                    "frontend_instances": 2,
                },
                "database": {
                    "instance_type": "db.r5.large",
                    "storage_gb": 100,
                    "backup_enabled": True,
                    "backup_retention_days": 30,
                    "multi_az": True,
                    "read_replicas": 1,
                },
                "redis": {
                    "instance_type": "cache.r5.large",
                    "memory_gb": 13,
                    "cluster_enabled": True,
                    "replicas": 2,
                },
                "monitoring": {
                    "metrics_retention_days": 90,
                    "detailed_monitoring": True,
                    "apm_enabled": True,
                },
                "scaling": {
                    "auto_scaling_enabled": True,
                    "min_instances": 3,
                    "max_instances": 10,
                    "target_cpu_utilization": 70,
                }
            }
        }

        return configs.get(self.environment, configs["development"])

    def apply_risk_adjustments(self, config):
        """Apply adjustments based on risk assessment"""
        if not self.risk_report:
            return config

        risk_score = self.risk_report.get('risk_score', 50)
        risk_level = self.risk_report.get('risk_level', 'MEDIUM')

        print(f"  📊 Risk Score: {risk_score}/100 ({risk_level})")
        print(f"  🔧 Applying risk-based adjustments...")

        # High risk deployments need more resources
        if risk_level in ['HIGH', 'CRITICAL']:
            print("  ⚠️ High risk detected - increasing resources and monitoring")

            # Increase compute resources by 50%
            if 'compute' in config:
                config['compute']['backend_instances'] = int(
                    config['compute']['backend_instances'] * 1.5
                )

            # Enable enhanced monitoring
            if 'monitoring' in config:
                config['monitoring']['detailed_monitoring'] = True
                config['monitoring']['alert_threshold_strict'] = True

            # Lower auto-scaling thresholds
            if 'scaling' in config and config['scaling'].get('auto_scaling_enabled'):
                config['scaling']['target_cpu_utilization'] = 60  # Lower threshold

        # Check for specific risk factors
        factors = self.risk_report.get('factors', [])
        for factor in factors:
            if factor.get('score', 0) >= 7:
                factor_name = factor.get('name', '')

                if 'Critical' in factor_name or 'Dependency' in factor_name:
                    # Enable canary deployment
                    config['deployment_strategy'] = 'canary'
                    config['canary_percentage'] = 10

                if 'Test Coverage' in factor_name:
                    # Enable extra monitoring and rollback capability
                    config['monitoring']['enable_anomaly_detection'] = True
                    config['rollback_enabled'] = True

        return config

    def configure_compute_resources(self, config):
        """Configure compute resources"""
        compute = config.get('compute', {})

        self.provision_plan['resources']['backend'] = {
            "type": "container",
            "image": "ghcr.io/ree/backend:latest",
            "instances": compute.get('backend_instances', 2),
            "cpu": compute.get('backend_cpu', '2 vCPU'),
            "memory": compute.get('backend_memory', '4 GB'),
            "port": 5001,
            "health_check": {
                "path": "/api/health",
                "interval": 30,
                "timeout": 10,
                "unhealthy_threshold": 3
            }
        }

        self.provision_plan['resources']['frontend'] = {
            "type": "container",
            "image": "ghcr.io/ree/frontend:latest",
            "instances": compute.get('frontend_instances', 1),
            "cpu": "1 vCPU",
            "memory": "1 GB",
            "port": 80,
            "health_check": {
                "path": "/health",
                "interval": 30,
                "timeout": 5,
                "unhealthy_threshold": 2
            }
        }

    def configure_database(self, config):
        """Configure database resources"""
        db_config = config.get('database', {})

        self.provision_plan['resources']['database'] = {
            "type": "mysql",
            "version": "8.0",
            "instance_type": db_config.get('instance_type', 'db.t3.medium'),
            "storage_gb": db_config.get('storage_gb', 50),
            "storage_type": "gp3",
            "multi_az": db_config.get('multi_az', False),
            "backup_enabled": db_config.get('backup_enabled', True),
            "backup_retention_days": db_config.get('backup_retention_days', 7),
            "read_replicas": db_config.get('read_replicas', 0),
            "parameters": {
                "max_connections": 300,
                "innodb_buffer_pool_size": "2G",
                "query_cache_size": "0",
                "slow_query_log": 1,
                "long_query_time": 2
            }
        }

    def configure_caching(self, config):
        """Configure caching layer"""
        redis_config = config.get('redis', {})

        self.provision_plan['resources']['redis'] = {
            "type": "redis",
            "version": "7.0",
            "instance_type": redis_config.get('instance_type', 'cache.t3.small'),
            "memory_gb": redis_config.get('memory_gb', 1.5),
            "cluster_enabled": redis_config.get('cluster_enabled', False),
            "replicas": redis_config.get('replicas', 0),
            "parameters": {
                "maxmemory-policy": "allkeys-lru",
                "timeout": 300
            }
        }

    def configure_networking(self, config):
        """Configure networking and load balancing"""
        self.provision_plan['resources']['load_balancer'] = {
            "type": "application",
            "scheme": "internet-facing",
            "ssl_enabled": True,
            "ssl_policy": "ELBSecurityPolicy-TLS-1-2-2017-01",
            "idle_timeout": 60,
            "connection_draining": 300,
            "health_check": {
                "enabled": True,
                "interval": 30,
                "timeout": 5,
                "healthy_threshold": 2,
                "unhealthy_threshold": 3
            },
            "routing": [
                {
                    "path": "/api/*",
                    "target": "backend",
                    "sticky_sessions": True
                },
                {
                    "path": "/*",
                    "target": "frontend"
                }
            ]
        }

    def setup_monitoring(self, config):
        """Setup monitoring and alerting"""
        monitoring_config = config.get('monitoring', {})

        self.provision_plan['monitoring'] = {
            "prometheus": {
                "enabled": True,
                "retention_days": monitoring_config.get('metrics_retention_days', 30),
                "scrape_interval": "30s",
                "targets": [
                    {"job": "backend", "port": 5001, "path": "/metrics"},
                    {"job": "mysql", "exporter": "mysqld_exporter"},
                    {"job": "redis", "exporter": "redis_exporter"}
                ]
            },
            "grafana": {
                "enabled": True,
                "dashboards": [
                    "application_overview",
                    "database_performance",
                    "api_metrics",
                    "infrastructure_health"
                ]
            },
            "alerting": {
                "enabled": True,
                "channels": ["email", "slack"],
                "rules": self.generate_alert_rules(monitoring_config)
            },
            "logging": {
                "level": "info" if self.environment == "production" else "debug",
                "retention_days": monitoring_config.get('metrics_retention_days', 30),
                "structured": True
            }
        }

    def generate_alert_rules(self, monitoring_config):
        """Generate monitoring alert rules"""
        strict = monitoring_config.get('alert_threshold_strict', False)

        rules = [
            {
                "name": "High Error Rate",
                "condition": "error_rate > 5%" if not strict else "error_rate > 2%",
                "severity": "critical",
                "duration": "5m"
            },
            {
                "name": "High Response Time",
                "condition": "p95_response_time > 1000ms" if not strict else "p95_response_time > 500ms",
                "severity": "warning",
                "duration": "10m"
            },
            {
                "name": "High CPU Usage",
                "condition": "cpu_usage > 80%",
                "severity": "warning",
                "duration": "15m"
            },
            {
                "name": "High Memory Usage",
                "condition": "memory_usage > 85%",
                "severity": "warning",
                "duration": "10m"
            },
            {
                "name": "Database Connection Pool Exhausted",
                "condition": "db_connections > 90% max_connections",
                "severity": "critical",
                "duration": "5m"
            },
            {
                "name": "Service Down",
                "condition": "up == 0",
                "severity": "critical",
                "duration": "1m"
            }
        ]

        return rules

    def configure_autoscaling(self, config):
        """Configure auto-scaling policies"""
        scaling_config = config.get('scaling', {})

        if not scaling_config.get('auto_scaling_enabled', False):
            self.provision_plan['scaling'] = {"enabled": False}
            return

        self.provision_plan['scaling'] = {
            "enabled": True,
            "backend": {
                "min_instances": scaling_config.get('min_instances', 2),
                "max_instances": scaling_config.get('max_instances', 10),
                "target_cpu_utilization": scaling_config.get('target_cpu_utilization', 70),
                "target_memory_utilization": 80,
                "scale_up_cooldown": 300,
                "scale_down_cooldown": 600,
                "policies": [
                    {
                        "name": "cpu_scaling",
                        "metric": "cpu_utilization",
                        "target": scaling_config.get('target_cpu_utilization', 70),
                        "scale_up_adjustment": "+50%",
                        "scale_down_adjustment": "-25%"
                    },
                    {
                        "name": "request_count_scaling",
                        "metric": "request_count_per_target",
                        "target": 1000,
                        "scale_up_adjustment": "+1 instance",
                        "scale_down_adjustment": "-1 instance"
                    }
                ]
            }
        }

    def generate_deployment_config(self):
        """Generate deployment configuration"""
        deployment_strategy = self.provision_plan.get('deployment_strategy', 'rolling')

        self.provision_plan['configuration'] = {
            "deployment_strategy": deployment_strategy,
            "rolling_update": {
                "max_surge": "25%",
                "max_unavailable": "25%"
            } if deployment_strategy == 'rolling' else None,
            "canary": {
                "percentage": self.provision_plan.get('canary_percentage', 10),
                "duration": "10m",
                "metrics_evaluation": True
            } if deployment_strategy == 'canary' else None,
            "health_check_grace_period": 60,
            "rollback_enabled": self.provision_plan.get('rollback_enabled', True),
            "environment_variables": {
                "NODE_ENV": self.environment,
                "LOG_LEVEL": "info" if self.environment == "production" else "debug",
                "ENABLE_METRICS": "true",
                "ENABLE_TRACING": "true" if self.environment in ["staging", "production"] else "false"
            }
        }


def main():
    parser = argparse.ArgumentParser(description='Intelligent Environment Provisioning')
    parser.add_argument('--environment', required=True, choices=['development', 'staging', 'production'])
    parser.add_argument('--risk-report', help='Path to risk assessment report')
    parser.add_argument('--output', default='provision-plan.json', help='Output file for provisioning plan')

    args = parser.parse_args()

    provisioner = IntelligentProvisioner(args.environment, args.risk_report)
    plan = provisioner.provision()

    # Print summary
    print("\n" + "="*60)
    print(f"📦 PROVISIONING PLAN - {args.environment.upper()}")
    print("="*60)

    print("\n🖥️ Compute Resources:")
    backend = plan['resources']['backend']
    print(f"  Backend: {backend['instances']} x {backend['cpu']} / {backend['memory']}")
    frontend = plan['resources']['frontend']
    print(f"  Frontend: {frontend['instances']} x {frontend['cpu']} / {frontend['memory']}")

    print("\n💾 Data Storage:")
    db = plan['resources']['database']
    print(f"  Database: {db['instance_type']} - {db['storage_gb']}GB")
    redis = plan['resources']['redis']
    print(f"  Redis: {redis['instance_type']} - {redis['memory_gb']}GB")

    print("\n📊 Monitoring:")
    monitoring = plan['monitoring']
    print(f"  Prometheus: {'Enabled' if monitoring['prometheus']['enabled'] else 'Disabled'}")
    print(f"  Grafana: {'Enabled' if monitoring['grafana']['enabled'] else 'Disabled'}")
    print(f"  Alerting: {len(monitoring['alerting']['rules'])} rules configured")

    print("\n⚖️ Auto-Scaling:")
    scaling = plan['scaling']
    if scaling['enabled']:
        backend_scaling = scaling['backend']
        print(f"  Range: {backend_scaling['min_instances']}-{backend_scaling['max_instances']} instances")
        print(f"  Target CPU: {backend_scaling['target_cpu_utilization']}%")
    else:
        print(f"  Disabled")

    print("="*60)

    # Save plan
    with open(args.output, 'w') as f:
        json.dump(plan, f, indent=2)

    print(f"\n✅ Provisioning plan saved to {args.output}")


if __name__ == '__main__':
    main()
