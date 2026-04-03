USE InvoiceDB;

-- Check if user exists and insert if not
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, Password, Role)
    VALUES ('admin', '123', 'Admin');
    
    PRINT 'Test user created successfully!';
    PRINT 'Username: admin';
    PRINT 'Password: 123';
END
ELSE
BEGIN
    PRINT 'Test user already exists!';
END
