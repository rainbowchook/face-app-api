import * as path from "node:path";

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import type { InstanceProps, LaunchTemplateSpotOptions } from "aws-cdk-lib/aws-ec2";
import { Instance, LaunchTemplate, SpotRequestType, Vpc, SubnetType, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import * as s3Assets from 'aws-cdk-lib/aws-s3-assets'
import DefaultVpc from "./vpc/default-vpc";
import ServerSecurityGroup from "./security-group/security-group";
import ServerRole from "./role/server-role";
import EC2SpotInstance from "./instance/ec2-instance";
import { readFileSync } from "node:fs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class FacesCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Add Docker Compose file as an asset
    const dockerComposeAsset = new s3Assets.Asset(this, 'DockerComposeAsset', {
      path: path.join(__dirname, '/../assets/docker_compose.yml')
    })
    //Need to copy dockerCOmposeAsset to /home/ec2-user/APP.  CD to this dir in the user data script
    // Create VPC in which to launch EC2 spot instance
    const { vpc } = new DefaultVpc(scope, id)

    // Create Security Group for EC2 spot instance
    const { serverSG } = new ServerSecurityGroup(scope, id, { vpc })
    
    // Create role for EC2 Spot Instance
    const { serverRole } = new ServerRole(scope, id)

    // Create EC2 Spot Instance
    const { ec2SpotInstance } = new EC2SpotInstance(scope, id, { vpc, serverRole, serverSG })

    // Load User Data Script and add User Data to the EC2 Spot Instance
    const userData = readFileSync('./lib/scripts/user-data.sh', 'utf8')
    ec2SpotInstance.addUserData(userData)

  }
}
