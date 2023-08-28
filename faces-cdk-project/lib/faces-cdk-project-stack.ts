// import { readFileSync } from 'node:fs'
import * as path from 'node:path'

import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { UserData } from 'aws-cdk-lib/aws-ec2'
import * as s3Assets from 'aws-cdk-lib/aws-s3-assets'
import DefaultVpc from './vpc/default-vpc'
import ServerSecurityGroup from './security-group/security-group'
import ServerRole from './role/server-role'
import EC2SpotInstance from './instance/ec2-instance'

export class FacesCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Add Docker Compose file as an asset
    const dockerComposeAsset = new s3Assets.Asset(this, 'DockerComposeAsset', {
      path: path.join(__dirname, '/assets/docker-compose.yml'),
    })

    // Create VPC in which to launch EC2 spot instance
    const { vpc } = new DefaultVpc(scope, id)

    // Create Security Group for EC2 spot instance
    const { serverSG } = new ServerSecurityGroup(scope, id, { vpc })

    // Create role for EC2 Spot Instance
    const { serverRole } = new ServerRole(scope, id)

    // Create EC2 Spot Instance
    const { ec2SpotInstance } = new EC2SpotInstance(scope, id, {
      vpc,
      serverRole,
      serverSG,
    })

    // Grant EC2 instance role read access for the asset
    dockerComposeAsset.grantRead(ec2SpotInstance.role)

    // Load User Data Script and add User Data to the EC2 Spot Instance
    // const userData = readFileSync('./lib/scripts/user-data.sh', 'utf8')
    // ec2SpotInstance.addUserData(userData)

    const userData = UserData.forLinux()

    // Install Docker
    userData.addCommands(
      'sudo yum update -y',
      'sudo amazon-linux-extras install docker -y',
      'sudo service docker start'
    )

    // Switch user to ec2-user and Create the /APP directory
    userData.addCommands('sudo -i -u ec2-user && mkdir /home/ec2-user/APP')

    //Download docker-compose asset from S3 and execute it
    const dockerComposeLocalPath = userData.addS3DownloadCommand({
      bucket: dockerComposeAsset.bucket,
      bucketKey: dockerComposeAsset.s3ObjectKey,
      localFile: '/home/ec2-user/APP/docker-compose.yml',
    })

    // Execute docker-compose and 1) pipe standard output to log file; 2) pipe standard error to same file
    userData.addCommands(
      `docker-compose -f ${dockerComposeLocalPath} up -d > /home/ec2-user/docker-compose.log 2>&1`
    )

    // ec2SpotInstance.userData.addCommands(userData.render())
    ec2SpotInstance.addUserData(userData.render())

    //Output the instance ID
    new cdk.CfnOutput(this, 'InstanceId', {
      value: ec2SpotInstance.instance.ref,
    })
  }
}
