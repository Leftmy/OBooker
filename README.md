# OBooker

OBooker - is a service that help users arrange their meetings and conferences

### Backend Architecture & Engineering Approaches

The backend of **OBooker** is built using modular architecture principles and TDD (Test-Driven Development).
- **Domain & Validation Isolation:** Critical business logic (data normalization, UTC time interval checks, password validation) is isolated into pure utility functions with no direct database dependencies. This ensures high test coverage via fast Jest unit tests applying the **Arrange-Act-Assert (AAA)** pattern.
- **Data Integrity & Security:** For data security and persistence, passwords are hashed using `bcryptjs`, and PostgreSQL is queried through Prisma ORM with explicit indexes and cascading relations.
- **Timezone Management:** All timestamps are processed and stored strictly in UTC (`ISO 8601`), guaranteeing consistent schedule rendering for users across any timezone while adhering to standard office working hours (Europe/Kyiv).