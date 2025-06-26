#!/bin/bash

# Morning Story - AWS Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-west-2}
ACCOUNT_ID=${AWS_ACCOUNT_ID}
ECR_REPOSITORY="morning-story-api"
ECS_CLUSTER="morning-story-cluster"
ECS_SERVICE="morning-story-api"

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}❌ AWS_ACCOUNT_ID environment variable is required${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Deploying Morning Story to AWS...${NC}"
echo -e "${YELLOW}Account ID: ${ACCOUNT_ID}${NC}"
echo -e "${YELLOW}Region: ${AWS_REGION}${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

# Check if logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Not logged in to AWS. Please run 'aws configure' or 'aws sso login'${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Step 1: Create RDS PostgreSQL instance
echo -e "${YELLOW}📊 Creating RDS PostgreSQL instance...${NC}"
if ! aws rds describe-db-instances --db-instance-identifier morning-story-postgres &> /dev/null; then
    aws rds create-db-instance \
        --cli-input-json file://infrastructure/aws/rds-postgres.json \
        --region $AWS_REGION
    echo -e "${GREEN}✅ RDS instance creation initiated${NC}"
else
    echo -e "${YELLOW}⚠️  RDS instance already exists${NC}"
fi

# Step 2: Create ElastiCache Redis cluster
echo -e "${YELLOW}🔴 Creating ElastiCache Redis cluster...${NC}"
if ! aws elasticache describe-cache-clusters --cache-cluster-id morning-story-redis &> /dev/null; then
    aws elasticache create-cache-cluster \
        --cli-input-json file://infrastructure/aws/elasticache-redis.json \
        --region $AWS_REGION
    echo -e "${GREEN}✅ ElastiCache cluster creation initiated${NC}"
else
    echo -e "${YELLOW}⚠️  ElastiCache cluster already exists${NC}"
fi

# Step 3: Create ECR repository if it doesn't exist
echo -e "${YELLOW}📦 Setting up ECR repository...${NC}"
if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION &> /dev/null; then
    aws ecr create-repository \
        --repository-name $ECR_REPOSITORY \
        --region $AWS_REGION \
        --image-scanning-configuration scanOnPush=true
    echo -e "${GREEN}✅ ECR repository created${NC}"
else
    echo -e "${YELLOW}⚠️  ECR repository already exists${NC}"
fi

# Step 4: Get ECR login token and login
echo -e "${YELLOW}🔑 Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
echo -e "${GREEN}✅ Logged into ECR${NC}"

# Step 5: Build and push Docker image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
IMAGE_TAG=$(git rev-parse --short HEAD)
IMAGE_URI=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG

docker build -f infrastructure/docker/Dockerfile -t $IMAGE_URI .
docker tag $IMAGE_URI $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

echo -e "${YELLOW}📤 Pushing Docker image to ECR...${NC}"
docker push $IMAGE_URI
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
echo -e "${GREEN}✅ Docker image pushed${NC}"

# Step 6: Create ECS cluster if it doesn't exist
echo -e "${YELLOW}🐳 Setting up ECS cluster...${NC}"
if ! aws ecs describe-clusters --clusters $ECS_CLUSTER --region $AWS_REGION | grep -q "ACTIVE"; then
    aws ecs create-cluster \
        --cluster-name $ECS_CLUSTER \
        --capacity-providers FARGATE \
        --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
        --region $AWS_REGION
    echo -e "${GREEN}✅ ECS cluster created${NC}"
else
    echo -e "${YELLOW}⚠️  ECS cluster already exists${NC}"
fi

# Step 7: Register task definition
echo -e "${YELLOW}📋 Registering ECS task definition...${NC}"
# Update task definition with actual image URI
sed "s|ACCOUNT_ID|$ACCOUNT_ID|g; s|REGION|$AWS_REGION|g" infrastructure/aws/ecs-task-definition.json > /tmp/task-def.json
aws ecs register-task-definition \
    --cli-input-json file:///tmp/task-def.json \
    --region $AWS_REGION
echo -e "${GREEN}✅ Task definition registered${NC}"

# Step 8: Create or update ECS service
echo -e "${YELLOW}🔄 Updating ECS service...${NC}"
if aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION | grep -q "ACTIVE"; then
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service $ECS_SERVICE \
        --task-definition morning-story-api \
        --force-new-deployment \
        --region $AWS_REGION
    echo -e "${GREEN}✅ ECS service updated${NC}"
else
    # Update service definition with actual values
    sed "s|ACCOUNT_ID|$ACCOUNT_ID|g; s|REGION|$AWS_REGION|g" infrastructure/aws/ecs-service.json > /tmp/service-def.json
    aws ecs create-service \
        --cli-input-json file:///tmp/service-def.json \
        --region $AWS_REGION
    echo -e "${GREEN}✅ ECS service created${NC}"
fi

# Clean up temp files
rm -f /tmp/task-def.json /tmp/service-def.json

echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo -e "${YELLOW}📋 What was deployed:${NC}"
echo "  • RDS PostgreSQL: morning-story-postgres"
echo "  • ElastiCache Redis: morning-story-redis"
echo "  • ECR Repository: $ECR_REPOSITORY"
echo "  • ECS Cluster: $ECS_CLUSTER"
echo "  • ECS Service: $ECS_SERVICE"
echo ""
echo -e "${YELLOW}🔗 Useful commands:${NC}"
echo "  aws ecs list-tasks --cluster $ECS_CLUSTER --region $AWS_REGION"
echo "  aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION"
echo "  aws logs tail /ecs/morning-story-api --follow --region $AWS_REGION"
echo ""
echo -e "${BLUE}🎯 Next steps:${NC}"
echo "  1. Update DNS to point to your load balancer"
echo "  2. Configure SSL certificate"
echo "  3. Update GitHub OAuth callback URLs"
echo "  4. Set up monitoring and alerts"