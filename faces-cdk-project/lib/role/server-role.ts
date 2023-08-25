import { Stack } from 'aws-cdk-lib'
import {
  Effect,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

export default class ServerRole extends Construct {
  public readonly serverRole
  constructor(scope: Construct, id: string) {
    super(scope, id)
    this.serverRole = new Role(this, 'server-role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
        ManagedPolicy.fromManagedPolicyName(scope, id, 'EC2instance'),
        ManagedPolicy.fromManagedPolicyName(scope, id, 'DockerOps'),
      ],
    })
  }
}

// export default class ServerRole extends Construct {
//   public readonly serverRole
//   constructor(scope: Construct, id: string) {
//     super(scope, id)
//     this.serverRole = new Role(this, 'server-role', {
//       assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
//       managedPolicies: [
//         ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
//         ManagedPolicy.fromAwsManagedPolicyName('AWSEC2SpotServiceRolePolicy'),
//         ManagedPolicy.fromManagedPolicyName(scope, id, 'DockerOps')
//       ],
//       inlinePolicies: {
//         ec2: new PolicyDocument({
//           statements: [
//             new PolicyStatement({
//               effect: Effect.ALLOW,
//               actions: ["ec2:ModifyInstanceAttribute"],
//               resources: ["*"],
//               conditions: {
//                 StringEquals: {
//                   "aws:RequestedRegion": [Stack.of(this).region],
//                 }
//               }
//             })
//           ]
//         })
//       }
//     })
//   }
// }
