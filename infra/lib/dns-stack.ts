/* =====================================================================
   The DNS zone for the app's own domain, e.g. pokeleet.sharonchen.dev.
   The parent domain (sharonchen.dev, wherever its DNS is hosted) hands
   this subdomain to Route 53 with four NS records, added once by hand;
   after that, deploys create the app's certificate and records here.
   A stack of its own, so the zone and its delegation outlive the app's.
===================================================================== */
import { CfnOutput, Fn, Stack, type StackProps } from 'aws-cdk-lib'
import * as route53 from 'aws-cdk-lib/aws-route53'
import type { Construct } from 'constructs'

export class DnsStack extends Stack {
  readonly zone: route53.PublicHostedZone

  constructor(scope: Construct, id: string, props: StackProps & { domain: string }) {
    super(scope, id, props)
    this.zone = new route53.PublicHostedZone(this, 'Zone', { zoneName: props.domain })
    // Lets Amazon issue the app's certificate. Without a CAA record here, the
    // parent's apply, and those often allow other authorities only (Vercel's do).
    new route53.CaaAmazonRecord(this, 'CertificateAuthority', { zone: this.zone })
    // the NS records to add for the subdomain at the parent domain's DNS host
    new CfnOutput(this, 'NameServers', { value: Fn.join(' ', this.zone.hostedZoneNameServers!) })
  }
}
