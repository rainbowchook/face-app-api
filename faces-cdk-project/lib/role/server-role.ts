import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

export default class ServerRole extends Construct {
  public readonly serverRole
  constructor(scope: Construct, id: string) {
    super(scope, id)
    this.serverRole = new Role(this, 'server-role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyACcess'),
      ],
      
    })
  }
}
