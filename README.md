# BloodLink — Blood Donor Registry and Search

> **"Connecting donors. Saving lives."**  
> A complete full-stack web application designed for emergency blood donor discovery, automated 90-day medical cooldown enforcement, and donation tracking.

---

## Table of Contents
1. [Problem Statement](#problem-statement)
2. [Project Objective](#project-objective)
3. [Core Features](#core-features)
4. [Technology Stack](#technology-stack)
5. [Project Architecture](#project-architecture)
6. [Database Design](#database-design)
7. [The 90-Day Medical Cooldown Business Rule](#the-90-day-medical-cooldown-business-rule)
8. [REST API Documentation](#rest-api-documentation)
9. [Project Directory Structure](#project-directory-structure)
10. [Prerequisites & MySQL Setup](#prerequisites--mysql-setup)
11. [How to Run the Application](#how-to-run-the-application)
12. [Sample API Requests & Testing](#sample-api-requests--testing)
13. [UI/UX & Screenshots](#uiux--screenshots)
14. [Viva & Interview Q&A](#viva--interview-qa)
15. [Future Enhancements](#future-enhancements)

---

## Problem Statement

During critical medical crises such as road accidents, acute anemia, complex surgeries, cancer treatments, and labor complications, procuring matching blood quickly is a matter of life and death. 

Traditional community lists and social media posts suffer from severe limitations:
- **Ineligible Donors Listed:** Donors who donated recently are still contacted, leading to critical time wasted making fruitless phone calls and medical rejections at blood banks.
- **Manual Overhead:** Blood banks and admins forget to manually reactivate donors after their recovery period, causing donor lists to shrink over time.
- **Lack of Real-time Verification:** No central system tracks when a donor gave blood or prevents double-donations within dangerous time windows.

---

## Project Objective

**BloodLink** solves these problems by providing:
1. **Dynamic Eligibility Filtering:** The application automatically filters out donors who are within their 90-day cooldown period. Only medically ready donors are displayed during emergency searches.
2. **Automated Re-enabling:** When 90 days elapse from the last donation date, the backend automatically transitions the donor back to `available = true` without requiring any manual admin click.
3. **Strict Backend Rule Enforcement:** All validation and business logic are enforced in the Spring Boot service layer, rejecting invalid donation attempts with clean HTTP 400 Bad Request responses.
4. **Modern Healthcare UI/UX:** A bespoke, responsive interface built with vanilla HTML5, CSS3, and JavaScript communicating with Spring Boot REST APIs.

---

## Core Features

- **Donor Registration:** Clean two-part form (Personal Details & Donation History) with client and server-side validation.
- **Emergency Donor Search:** Search by Blood Group (A+, A-, B+, B-, AB+, AB-, O+, O-) and City (e.g. Coimbatore, Chennai). Returns **only** available donors.
- **Automated 90-Day Cooldown:** Enforced using Java's `LocalDate` APIs.
- **Record Blood Donation:** Live inspection card displays the selected donor's eligibility before saving. If the donor is in cooldown, submission is blocked.
- **Healthcare Analytics Dashboard:** Top metric cards, real-time Chart.js doughnut chart for blood group distribution, and recent donation history log.
- **Donor Management Registry:** Search, filter by availability, view detailed profiles, edit details, and safely delete donors with confirmation modals.
- **Global Error Handling:** Clean `@RestControllerAdvice` returning formatted JSON without raw stack traces.

---

## Technology Stack

### Backend
- **Java 17 / 21 LTS**
- **Spring Boot 3.3.4**
- **Spring Web** (RESTful API architecture)
- **Spring Data JPA & Hibernate** (ORM and relational mapping)
- **Spring Validation / Jakarta Bean Validation** (`@NotBlank`, `@Email`, `@PastOrPresent`, etc.)
- **MySQL 8.0** (Relational database)
- **Apache Maven 3.9+** (Build & dependency management)

### Frontend
- **HTML5 & Semantic Web**
- **CSS3** (Custom healthcare design tokens: `#D62839` primary, `#1F2937` dark, `#F7F8FA` background, CSS Grid & Flexbox)
- **Vanilla JavaScript (ES6+)** (No React, Vue, Angular, Bootstrap, or Tailwind)
- **Native Fetch API**
- **Chart.js** (Lightweight canvas visualization for blood group distribution)

---

## Project Architecture

BloodLink follows a clean, layered architectural pattern:

```
[ Frontend: HTML5 / CSS3 / Vanilla JS / Fetch API ]
                        │
                        ▼ (HTTP / JSON)
[ Controller Layer: Spring REST Controllers ]
                        │
                        ▼ (DTOs & Validation)
[ Service Layer: Business Logic & 90-Day Cooldown ]
                        │
                        ▼ (Entities)
[ Repository Layer: Spring Data JPA Repositories ]
                        │
                        ▼ (SQL Queries)
[ MySQL Relational Database: `bloodlink` ]
```

### Layer Responsibilities
- **Controller Layer (`com.bloodlink.controller`):** Handles incoming HTTP requests, endpoint mappings, and returns `ResponseEntity`.
- **Service Layer (`com.bloodlink.service`):** Contains all business logic (e.g., `isEligible()`, cooldown sync, validation).
- **Repository Layer (`com.bloodlink.repository`):** Spring Data JPA interfaces for database queries.
- **Model Layer (`com.bloodlink.model`):** JPA `@Entity` classes representing tables in MySQL.
- **DTO Layer (`com.bloodlink.dto`):** Request and response transfer objects decoupling internal entity structure from API clients.
- **Exception Layer (`com.bloodlink.exception`):** Custom exceptions and `@RestControllerAdvice` global handler.

---

## Database Design

Database Name: `bloodlink`

### 1. `blood_groups` Table (`BloodGroup.java`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `name` | VARCHAR(10) | NOT NULL, UNIQUE | Blood group symbol (A+, A-, B+, etc.) |

### 2. `donors` Table (`Donor.java`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `full_name` | VARCHAR(100) | NOT NULL | Donor's full legal name |
| `blood_group_id`| BIGINT | NOT NULL, FOREIGN KEY | References `blood_groups(id)` (`@ManyToOne`) |
| `city` | VARCHAR(100) | NOT NULL | Location/City |
| `phone` | VARCHAR(20) | NOT NULL | 10-digit phone number |
| `email` | VARCHAR(100) | NOT NULL | Valid email address |
| `last_donation_date` | DATE | NULLABLE | Date of most recent donation |
| `available` | BOOLEAN | NOT NULL, DEFAULT TRUE | Real-time eligibility flag |
| `created_at` | DATETIME | NOT NULL | Registration timestamp |

### 3. `donation_records` Table (`DonationRecord.java`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `donation_date` | DATE | NOT NULL | Date donation took place |
| `donor_id` | BIGINT | NOT NULL, FOREIGN KEY | References `donors(id)` (`@ManyToOne`) |
| `created_at` | DATETIME | NOT NULL | Record creation timestamp |

---

## The 90-Day Medical Cooldown Business Rule

Whole blood donation removes approximately 450–500 mL of blood, containing red blood cells, iron, and plasma. The human body takes **8 to 12 weeks** to regenerate lost erythrocytes and restore hemoglobin to normal safe levels.

### Algorithmic Implementation in `DonorService.java`
```java
public boolean isEligible(Donor donor) {
    if (donor.getLastDonationDate() == null) {
        return true; // First-time donors are eligible immediately
    }

    LocalDate eligibleDate = donor.getLastDonationDate().plusDays(90);
    return !LocalDate.now().isBefore(eligibleDate);
}
```

### Auto Re-Enabling Mechanism
Whenever donors are retrieved or searched via the service layer, `syncDonorAvailability(donor)` dynamically tests `isEligible(donor)` against `LocalDate.now()`. If 90 days have elapsed, `donor.setAvailable(true)` is saved to the database. **No admin intervention is required.**

### Preventing Invalid Donations
When attempting to record a donation via `POST /api/donations`:
```java
if (!donorService.isEligible(donor)) {
    LocalDate eligibleDate = donor.getLastDonationDate().plusDays(90);
    throw new BusinessRuleException(
        "Donor is currently unavailable. The 90-day cooldown period has not ended. Eligible again on: " + eligibleDate);
}
```
The request is aborted and returns HTTP `400 BAD REQUEST`.

---

## REST API Documentation

| HTTP Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/blood-groups` | Retrieve all 8 blood groups |
| `GET` | `/api/donors` | Retrieve all donors with live cooldown calculation |
| `GET` | `/api/donors/{id}` | Retrieve single donor by ID |
| `POST` | `/api/donors` | Register a new donor |
| `PUT` | `/api/donors/{id}` | Update donor details |
| `DELETE` | `/api/donors/{id}` | Delete donor and their donation history |
| `GET` | `/api/donors/search?bloodGroup=O%2B&city=Coimbatore` | Search **only available** donors |
| `GET` | `/api/donations` | List all donation records |
| `POST` | `/api/donations` | Record a donation (triggers 90-day cooldown) |
| `GET` | `/api/dashboard` | Dashboard metrics, distribution, and recent logs |

---

## Project Directory Structure

```
BloodLink/
├── pom.xml
├── README.md
└── src/
    └── main/
        ├── java/
        │   └── com/
        │       └── bloodlink/
        │           ├── BloodLinkApplication.java
        │           ├── DataInitializer.java
        │           ├── controller/
        │           │   ├── BloodGroupController.java
        │           │   ├── DashboardController.java
        │           │   ├── DonationRecordController.java
        │           │   └── DonorController.java
        │           ├── dto/
        │           │   ├── ApiResponse.java
        │           │   ├── DashboardResponse.java
        │           │   ├── DonationRequest.java
        │           │   ├── DonationResponse.java
        │           │   ├── DonorRequest.java
        │           │   └── DonorResponse.java
        │           ├── exception/
        │           │   ├── BusinessRuleException.java
        │           │   ├── GlobalExceptionHandler.java
        │           │   └── ResourceNotFoundException.java
        │           ├── model/
        │           │   ├── BloodGroup.java
        │           │   ├── DonationRecord.java
        │           │   └── Donor.java
        │           ├── repository/
        │           │   ├── BloodGroupRepository.java
        │           │   ├── DonationRecordRepository.java
        │           │   └── DonorRepository.java
        │           └── service/
        │               ├── BloodGroupService.java
        │               ├── DashboardService.java
        │               ├── DonationRecordService.java
        │               └── DonorService.java
        └── resources/
            ├── application.properties
            └── static/
                ├── about.html
                ├── dashboard.html
                ├── donations.html
                ├── donors.html
                ├── index.html
                ├── register-donor.html
                ├── search.html
                ├── css/
                │   └── style.css
                └── js/
                    ├── api.js
                    ├── dashboard.js
                    ├── donations.js
                    ├── donors.js
                    ├── register.js
                    └── search.js
```

---

## Prerequisites & MySQL Setup

1. **Java Development Kit (JDK 17 or higher)**
2. **Apache Maven 3.8+**
3. **MySQL Server 8.0+**

### Database Setup
1. Log into MySQL shell or Workbench:
   ```sql
   mysql -u root -p
   ```
2. Create the database:
   ```sql
   CREATE DATABASE bloodlink;
   ```
3. Update `src/main/resources/application.properties` if your MySQL password differs from default:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/bloodlink?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata
   spring.datasource.username=root
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```

---

## How to Run the Application

### Option A: Using Maven Command Line
```bash
# 1. Clone or navigate to the project directory
cd BloodLink

# 2. Compile and package
mvn clean package -DskipTests

# 3. Run the Spring Boot application
mvn spring-boot:run
```

### Option B: Running the Executable JAR
```bash
java -jar target/bloodlink-1.0.0.jar
```

Once started, open your web browser and visit:
👉 **`http://localhost:8080/`**

---

## Sample API Requests & Testing

### 1. Register Donor
**POST** `/api/donors`
```json
{
  "fullName": "Sanjay V",
  "bloodGroupId": 7,
  "city": "Coimbatore",
  "phone": "9876543299",
  "email": "sanjay.v@example.com",
  "lastDonationDate": null
}
```

### 2. Search Available Donors
**GET** `/api/donors/search?bloodGroup=O%2B&city=Coimbatore`  
*(Notice: Rahul who donated on 2026-09-01 is within cooldown and will **NOT** appear in the response)*

### 3. Record Blood Donation
**POST** `/api/donations`
```json
{
  "donorId": 2,
  "donationDate": "2026-09-28"
}
```

### 4. Attempt Illegal Donation During Cooldown
**POST** `/api/donations` with `donorId: 1` (Rahul in cooldown)  
**Expected Response:** `400 BAD REQUEST`
```json
{
  "success": false,
  "message": "Donor is currently unavailable. The 90-day cooldown period has not ended. Eligible again on: 2026-11-30"
}
```

---

## UI/UX & Screenshots

- **Landing Page (`index.html`):** Hero section, emergency search CTA, 4-step workflow, and live counter metrics.
- **Dashboard (`dashboard.html`):** 4 metric cards, Chart.js doughnut chart of blood groups, and recent donations table.
- **Donor Registry (`donors.html`):** Full donor management table with dynamic `AVAILABLE` and `COOLDOWN (xd left)` badges, and View/Edit/Delete modals.
- **Find Donors (`search.html`):** Emergency search interface with card grid, contact popup, and clear empty state.
- **Record Donation (`donations.html`):** Live donor status inspection card that dynamically locks submission if the donor is in cooldown.

---

## Viva & Interview Q&A

**Q1: How is the 90-day cooldown enforced?**  
*Answer:* In `DonorService.java`, we calculate `donor.getLastDonationDate().plusDays(90)`. If `LocalDate.now()` is before this date, the donor is marked ineligible (`available = false`). This is checked on retrieval, on search queries, and strictly verified before recording any donation in `DonationRecordService.java`.

**Q2: What happens when 90 days have passed? Does an admin need to click enable?**  
*Answer:* No. The system automatically recalculates eligibility during data retrieval using `syncDonorAvailability()`. Once `LocalDate.now()` is on or after the eligible date, the status updates to `available = true` in real-time.

**Q3: Why use Vanilla JavaScript instead of React or Angular?**  
*Answer:* Vanilla JavaScript ensures lightweight execution, zero build pipeline dependencies, fast initial page load times, and transparent code that is easy to explain and demonstrate.

---

## Future Enhancements
1. **SMS / WhatsApp Notification Integration:** Automated SMS notification to donors when their 90-day cooldown ends and they become eligible again.
2. **Geographical Distance Radius:** Integration with OpenStreetMap / Google Maps API to search donors within a 15km or 25km radius.
3. **Blood Request Urgency Flag:** Allow hospitals to broadcast emergency SOS alerts for rare blood groups (e.g. O-, AB-).

---

## License & Authors
Developed as an academic software engineering project for **BloodLink — Blood Donor Registry and Search**.
