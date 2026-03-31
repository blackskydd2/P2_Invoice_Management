USE InvoiceDB;

-- Create Admin user
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, Password, Role)
    VALUES ('admin', 'admin123', 'Admin');
    PRINT 'Admin user created: admin/admin123';
END

-- Create FinanceUser
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'finance')
BEGIN
    INSERT INTO Users (Username, Password, Role)
    VALUES ('finance', 'finance123', 'FinanceUser');
    PRINT 'Finance user created: finance/finance123';
END

-- Create regular user (no special permissions)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'user')
BEGIN
    INSERT INTO Users (Username, Password, Role)
    VALUES ('user', 'user123', 'User');
    PRINT 'Regular user created: user/user123';
END

-- Display all users
SELECT * FROM Users;
