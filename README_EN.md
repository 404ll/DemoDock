# DemoDock ｜ [中文](https://github.com/404ll/DemoDock/blob/main/README.md)

**Where Projects Dock, and Ideas Rock.**

---

### 1. Product Background

In the Web3 developer community, numerous high-quality demo projects are scattered across different platforms, lacking a unified on-chain storage and access solution. 
To enable officials, judges, and users to easily browse and evaluate demo content, a blockchain-based platform for project collection with permanent storage and access control is essential.

This platform is built upon **Walrus (distributed storage)** and **Seal (encrypted access control)**. 
It allows developers to upload complete demo packages (code, PPT, videos, etc.) and set access permissions to ensure information security and controlled sharing.

---

### 2. Product Goals

* Provide a unified platform for organizers/judges to collect and evaluate demo projects
* Offer developers a blockchain-based space to showcase their work with privacy and permission controls
* Record system activities on the Sui blockchain to ensure audibility and trust

---

### 3. Core Features

#### 1. Demo Submission (Card)

* Supports uploading GitHub links, PDFs, PPTs, MP4s, and more
* Files are stored on Walrus
* Access permissions can be configured (Public / Request Key)
* Generates a unique Demo Card showing title, description, author, tags, creation time, and preview

#### 2. Access Control (Powered by Seal)

* Demo content is encrypted before uploading using Seal
* Two access modes:

  * **Auto Authorization** (e.g., holding a specific NFT or points)
  * **Manual Approval** (author reviews and approves requests)
* Authorization logs are recorded on-chain for auditability

#### 3. Demo Browsing & Access Request

* All demos display basic information (Card)
* Users can click to request access
* A blockchain access request transaction is automatically generated
* If the key is granted, the front-end decrypts and displays the content

#### 4. Project Search & Filtering

* Supports search by tags, keywords, and time range
* Sorting available by likes or view count

#### 5. Incentive Mechanism

* Users can like and comment on quality demos
* Token rewards are triggered by views/likes
* Early users are eligible for upload storage subsidies (e.g., 100MB quota)

---

### 4. Key Pages

1. **Homepage**: Project list + filters + upload entry
2. **Demo Card Detail Page**: Basic info + access request button
3. **Upload Page**: Form submission + file upload + permission setup
4. **Authorization Center**: Developers manage access requests and approve keys
5. **User Dashboard**: Uploaded projects / Accessed projects / User points

---

### 5. Project Roles

| Role                 | Permissions                                    |
| -------------------- | ---------------------------------------------- |
| Regular User         | Browse public content, request access          |
| Registered Developer | Upload demos, manage access permissions        |
| Officials / Judges   | View all content (requires special credential) |

---

### 6. Risks & Solutions

| Risk                        | Solution                                                                 |
| --------------------------- | ------------------------------------------------------------------------ |
| High learning curve of Seal | Provide one-click key request and automatic decryption experience        |
| High storage cost           | Subsidize early users or incentivize with platform tokens                |
| Upload abuse                | Enforce format/size/frequency limits, supported by manual review process |

---

### 7. Future Expansion

* Integration with DoraHacks, Questbook, and other Hackathon platforms
* Support for on-chain commenting and NFT-based reward systems

---

### 8. Delivery Plan (Suggested)

| Phase                          | Content                                                                      | Timeline | Status                |
| ------------------------------ | ---------------------------------------------------------------------------- | -------- | --------------------- |
| V1.0 PoC                       | File upload + encryption + Card generation + access request flow             | 2 weeks  | ✅ Completed           |
| V1.1 Rewards & Filtering       | Search by type, demo count statistics                                        | 1 week   | ✅ Completed           |
| V1.2 Integration & Public Beta | Integrate with Hackathon platforms, token incentives, and auto authorization | 2 weeks  | ❌ Not yet implemented |

---

