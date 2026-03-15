import "dotenv/config";
import { pool } from "./neon";

async function initializeDatabase() {
  try {
    console.log("Initializing database...");

    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ admins table created successfully");

    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        credits INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ users table created successfully");

    // Create onboarding_progress table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS onboarding_progress (
        user_id VARCHAR(255) PRIMARY KEY,
        current_step INTEGER DEFAULT 1 NOT NULL,
        completed BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ onboarding_progress table created successfully");

    // Create company_details table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_details (
        user_id VARCHAR(255) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        website_url VARCHAR(255),
        business_email VARCHAR(255),
        phone_number VARCHAR(50),
        industry VARCHAR(255),
        industry_other VARCHAR(255),
        product_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ company_details table created successfully");

    // Create target_market table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS target_market (
        user_id VARCHAR(255) PRIMARY KEY,
        target_audience VARCHAR(255),
        target_country VARCHAR(255),
        target_state_city VARCHAR(255),
        business_type VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ target_market table created successfully");

    // Create buyer_keywords table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS buyer_keywords (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        keyword VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ buyer_keywords table created successfully");

    // Create platforms_to_monitor table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS platforms_to_monitor (
        user_id VARCHAR(255) PRIMARY KEY,
        linkedin BOOLEAN DEFAULT false NOT NULL,
        twitter BOOLEAN DEFAULT false NOT NULL,
        reddit BOOLEAN DEFAULT false NOT NULL,
        quora BOOLEAN DEFAULT false NOT NULL,
        facebook BOOLEAN DEFAULT false NOT NULL,
        youtube BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ platforms_to_monitor table created successfully");

    // Create user_subscriptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        plan_name VARCHAR(255) NOT NULL,
        amount_paid DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ user_subscriptions table created successfully");

    // Create event_waitlist table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_waitlist (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        company VARCHAR(255),
        industry VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ event_waitlist table created successfully");

    // Create event_payments table for event-specific transactions  
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_payments (
        id VARCHAR(255) PRIMARY KEY,
        event_waitlist_id VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        event_name VARCHAR(255) NOT NULL,
        ticket_type VARCHAR(255),
        amount_paid DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        payment_status VARCHAR(50) DEFAULT 'COMPLETED',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ event_payments table created successfully");

    // Insert sample data
    console.log("\nInserting sample data...");

    // Insert sample users
    await pool.query(`
      INSERT INTO users (id, email, name, credits) VALUES
        ('user1', 'john@example.com', 'John Doe', 100),
        ('user2', 'jane@example.com', 'Jane Smith', 50),
        ('user3', 'bob@example.com', 'Bob Wilson', 75)
      ON CONFLICT DO NOTHING;
    `);

    console.log("✓ Sample users inserted");

    // Insert sample subscriptions
    await pool.query(`
      INSERT INTO user_subscriptions (id, user_id, plan_name, billing_cycle, currency, amount_paid, status, end_date) 
      SELECT gen_random_uuid(), user_id, plan_name, billing_cycle, currency, amount_paid::numeric, status, end_date
      FROM (VALUES
        ('user1', 'Pro', 'MONTHLY', 'USD', 99.99, 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '1 month'),
        ('user2', 'Starter', 'MONTHLY', 'USD', 29.99, 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '1 month'),
        ('user3', 'Business', 'ANNUAL', 'USD', 299.99, 'ACTIVE', CURRENT_TIMESTAMP + INTERVAL '1 year')
      ) AS t(user_id, plan_name, billing_cycle, currency, amount_paid, status, end_date)
      WHERE NOT EXISTS (SELECT 1 FROM user_subscriptions WHERE user_id = t.user_id);
    `);

    console.log("✓ Sample subscriptions inserted");

    // Insert sample target market
    await pool.query(`
      INSERT INTO target_market (user_id, target_country) VALUES
        ('user1', 'United States'),
        ('user2', 'Canada'),
        ('user3', 'United Kingdom')
      ON CONFLICT DO NOTHING;
    `);

    console.log("✓ Sample target market inserted");

    // Insert sample event registrations
    await pool.query(`
      INSERT INTO event_waitlist (id, event_id, name, email, phone_number, company, industry)
      SELECT gen_random_uuid(), event_id, name, email, phone_number, company, industry
      FROM (VALUES
        (gen_random_uuid(), 'John Smith', 'event1@example.com', '+1-555-0101', 'Tech Corp', 'Technology'),
        (gen_random_uuid(), 'Sarah Johnson', 'event2@example.com', '+1-555-0102', 'Finance Inc', 'Finance'),
        (gen_random_uuid(), 'Mike Williams', 'event3@example.com', '+1-555-0103', 'Health Solutions', 'Healthcare')
      ) AS t(event_id, name, email, phone_number, company, industry)
      WHERE NOT EXISTS (SELECT 1 FROM event_waitlist WHERE email = t.email);
    `);

    console.log("✓ Sample event registrations inserted");

    // Insert sample event payments
    await pool.query(`
      INSERT INTO event_payments (id, event_waitlist_id, email, event_name, ticket_type, amount_paid, payment_status, payment_method) 
      SELECT 'evt_pay_' || gen_random_uuid()::text, NULL, email, event_name, ticket_type, amount_paid, payment_status, payment_method
      FROM (VALUES
        ('event1@example.com', 'LeadEquator Summit 2026', 'VIP Pass', 299.99, 'COMPLETED', 'Credit Card'),
        ('event1@example.com', 'LeadEquator Summit 2026', 'Workshop Add-on', 99.99, 'COMPLETED', 'Credit Card'),
        ('event2@example.com', 'LeadEquator Summit 2026', 'Standard Pass', 149.99, 'COMPLETED', 'PayPal'),
        ('event3@example.com', 'B2B Marketing Workshop', 'Early Bird', 199.99, 'COMPLETED', 'Credit Card')
      ) AS t(email, event_name, ticket_type, amount_paid, payment_status, payment_method)
      ON CONFLICT DO NOTHING;
    `);

    console.log("✓ Sample event payments inserted");

    console.log("\n✅ Database initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

initializeDatabase();
