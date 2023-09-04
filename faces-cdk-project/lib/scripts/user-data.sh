#!/bin/bash
# Install Docker
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo service docker start

# Install AWS CLI
sudo amazon-linux-extras install aws-cli -y

# Download docker-compose asset from S3
aws s3 cp ${dockerComposeAsset.s3ObjectUrl} ./docker-compose.yml

# Switch to ec2-user and run docker-compose
su - ec2-user -c "cd /path-on-instance && docker-compose -f docker-compose.yml up -d"