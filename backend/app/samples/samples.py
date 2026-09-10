# Sample 1: BEC Executive Wire Fraud
SAMPLE_BEC_EML = """Received: from mail-relay.targetcorp.internal (10.0.1.50) by mx01.targetcorp.internal (10.0.1.10) with ESMTP id trg10294; Wed, 09 Sep 2026 14:35:12 +0000
Received: from gateway.cloudmail-filter.net (54.240.12.18) by mail-relay.targetcorp.internal (10.0.1.50) with ESMTPS id rly84729; Wed, 09 Sep 2026 14:35:10 +0000
Received: from tor-exit-node.zwiebelfreunde.de (185.220.101.5) by gateway.cloudmail-filter.net (54.240.12.18) with ESMTP id gtw39847; Wed, 09 Sep 2026 14:35:05 +0000
Authentication-Results: mx01.targetcorp.internal; spf=softfail (mail.targetcorp.internal: domain of executing-desk@vip-finance-portal.com does not designate 185.220.101.5 as permitted sender) smtp.mailfrom=executing-desk@vip-finance-portal.com; dkim=none; dmarc=fail (p=quarantine dis=none) header.from=acmecorp.com
From: "Johnathan Doe (CEO)" <john.doe@acmecorp.com>
Reply-To: "Executive Desk" <executing-desk@vip-finance-portal.com>
To: "Sarah Jenkins (Finance Lead)" <sarah.jenkins@acmecorp.com>
Subject: URGENT: Confidential Wire Transfer Authorization Required - Project Titan
Date: Wed, 09 Sep 2026 14:34:50 +0000
Message-ID: <20260909143450.48271.ceo@acmecorp.com>
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: 7bit
X-Originating-IP: [185.220.101.5]
X-Mailer: WebMail Executive Client 4.2

Sarah,

I am currently in an executive board meeting and cannot take phone calls. 

We need to finalize the confidential Project Titan acquisition tranche immediately today before market close. Please initiate a wire transfer of $148,500 USD to our escrow legal counsel account right now.

Do not delay or discuss this with anyone in the office until the public announcement is released tomorrow morning.

Reply directly to this email with the wire confirmation number once submitted.

Johnathan Doe
Chief Executive Officer
Acme Corporation
"""

# Sample 2: Credential Harvester Phishing
SAMPLE_CREDENTIAL_PHISHING_EML = """Received: from mx.targetcorp.internal (10.0.1.10) by mailbox.targetcorp.internal (10.0.1.25) with ESMTP id mbx7741; Wed, 09 Sep 2026 11:20:15 +0000
Received: from edge-inbound.antispam.io (198.51.100.42) by mx.targetcorp.internal (10.0.1.10) with ESMTPS id edg9921; Wed, 09 Sep 2026 11:20:12 +0000
Received: from vps-49447.hostkey.ru (194.26.29.110) by edge-inbound.antispam.io (198.51.100.42) with ESMTP id vps1120; Wed, 09 Sep 2026 11:20:00 +0000
Authentication-Results: mx.targetcorp.internal; spf=fail (protection.outlook.com: domain of security@rnicrosoft-security.com does not designate 194.26.29.110 as permitted sender) smtp.mailfrom=security@rnicrosoft-security.com; dkim=fail (signature verification failed); dmarc=fail header.from=microsoft.com
From: "Microsoft Security Team" <no-reply@rnicrosoft-security.com>
Reply-To: "Security Desk" <helpdesk@rnicrosoft-security.com>
To: "Employee" <victim@targetcorp.com>
Subject: Action Required: Your Microsoft 365 Password Expires in 24 Hours
Date: Wed, 09 Sep 2026 11:19:40 +0000
Message-ID: <ms-sec-99482019-2026@rnicrosoft-security.com>
MIME-Version: 1.0
Content-Type: text/html; charset="UTF-8"

<html>
<body>
<h2>Microsoft 365 Security Alert</h2>
<p>Dear User,</p>
<p>Your corporate password will expire today within 24 hours. To prevent immediate account suspension and retain access to your mailbox, you must verify your login credentials right now.</p>
<p><a href="http://198.51.100.42/auth/login.php?email=victim@targetcorp.com&token=a8f934b92">Click here to keep your current password and update your sign-in credentials</a></p>
<p>Failure to verify immediately will result in termination of your remote access sessions.</p>
<br>
<p>Microsoft Online Security Division<br>One Microsoft Way, Redmond, WA</p>
</body>
</html>
"""

# Sample 3: Supply Chain Invoice Fraud with Malicious Attachment
SAMPLE_INVOICE_FRAUD_EML = """Received: from mx.targetcorp.internal (10.0.1.10) by mailbox.targetcorp.internal (10.0.1.25) with ESMTP id mbx1049; Wed, 09 Sep 2026 09:15:20 +0000
Received: from relay-panama.nordvpn-infra.net (45.142.122.88) by mx.targetcorp.internal (10.0.1.10) with ESMTPS id pnm3812; Wed, 09 Sep 2026 09:15:15 +0000
Authentication-Results: mx.targetcorp.internal; spf=fail smtp.mailfrom=billing@globa1tech-invoicing.net; dkim=none; dmarc=fail
From: "GlobalTech Solutions Accounts" <billing@globa1tech-invoicing.net>
Reply-To: "Remittance Desk" <remittance@globa1tech-invoicing.net>
To: "Accounts Payable" <ap@targetcorp.com>
Subject: Revised Remittance Advice & Overdue Invoice #INV-2026-8941 ($82,400 USD)
Date: Wed, 09 Sep 2026 09:14:55 +0000
Message-ID: <inv-8941-20260909@globa1tech-invoicing.net>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="----=_Part_991823_10283"

------=_Part_991823_10283
Content-Type: text/plain; charset="UTF-8"

Dear Accounts Payable,

Please find attached the revised invoice INV-2026-8941 for $82,400 USD regarding software licensing services.

NOTE: Our banking details have been updated effective immediately due to our annual audit. Please ensure remittance is processed to our new beneficiary account listed inside the attached remittance statement.

Kindly confirm once the wire transfer is scheduled.

Regards,
GlobalTech Solutions Finance Team
------=_Part_991823_10283
Content-Type: application/vnd.ms-word.document.macroEnabled.12; name="Invoice_INV-8941.pdf.docm"
Content-Disposition: attachment; filename="Invoice_INV-8941.pdf.docm"
Content-Transfer-Encoding: base64

UEsDBBQAAAAIAKBmV1V2YmFQAAAAAGQAAAAIAAAAUEFZMTAwMV92YmFQcm9qZWN0LmJpbgBNYWNy
b1BheWxvYWRTaWduYXR1cmVBdXRvT3Blbl9FeGVjdXRlX1NoZWxsQ29kZQ==
------=_Part_991823_10283--
"""

# Sample 4: Legitimate Benign Email
SAMPLE_BENIGN_EML = """Received: from mail-dm6nam11on2040.outbound.protection.outlook.com (40.107.240.40) by mx01.targetcorp.internal (10.0.1.10) with ESMTPS id msft992; Wed, 09 Sep 2026 08:00:10 +0000
Received: from internal-app.microsoft.com (20.42.65.10) by mail-dm6nam11on2040.outbound.protection.outlook.com with HTTPS; Wed, 09 Sep 2026 08:00:05 +0000
Authentication-Results: mx01.targetcorp.internal; spf=pass (protection.outlook.com: domain of newsletter@microsoft.com designates 40.107.240.40 as permitted sender) smtp.mailfrom=newsletter@microsoft.com; dkim=pass (signature verified) header.d=microsoft.com; dmarc=pass action=none header.from=microsoft.com
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=microsoft.com; s=selector1; h=From:To:Subject:Date:Message-ID; bh=9a8f4c2e=; b=k284jfls=
From: "Microsoft Azure Engineering" <newsletter@microsoft.com>
To: "Engineering Team" <devs@targetcorp.com>
Subject: Azure Cloud Security & Resilience Monthly Briefing - September 2026
Date: Wed, 09 Sep 2026 08:00:00 +0000
Message-ID: <msft-azure-briefing-202609@microsoft.com>
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"

Hello Team,

Welcome to the September 2026 edition of the Azure Cloud Security and Resilience briefing.

This month, we are highlighting new zero-trust baseline controls, enhanced encryption key rotation features, and best practices for securing API endpoints.

To read the full engineering whitepaper, visit the official Microsoft docs portal at https://docs.microsoft.com/azure/security.

Best regards,
Azure Engineering Team
Microsoft Corporation
"""
