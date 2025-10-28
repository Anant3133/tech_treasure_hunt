# Bulk Team Registration Guide

## Overview
The admin panel now supports bulk registration of teams via CSV upload. This feature automatically generates passwords for each team and provides a downloadable credentials file.

## CSV Format

### Required Columns
```csv
Team Name, Member 1 Name, Member 1 Contact, Member 2 Name, Member 2 Contact, Member 3 Name, Member 3 Contact, Member 4 Name, Member 4 Contact
```

### Example CSV
```csv
Team Name,Member 1 Name,Member 1 Contact,Member 2 Name,Member 2 Contact,Member 3 Name,Member 3 Contact,Member 4 Name,Member 4 Contact
Team Alpha,John Doe,1234567890,Jane Smith,0987654321,Bob Johnson,1111111111,Alice Williams,2222222222
Team Beta,Mike Brown,3333333333,Sarah Davis,4444444444,,,,
Team Gamma,Eve Wilson,5555555555,Frank Martin,6666666666,Grace Lee,7777777777,
```

## Instructions

### For Admins:

1. **Prepare Excel/CSV File**
   - Create a new Excel spreadsheet or use the template
   - Add team names in the first column
   - Add up to 4 members per team (name and contact pairs)
   - Members 3 and 4 are optional - leave blank if not needed
   - Save as CSV file

2. **Access Admin Panel**
   - Navigate to Admin Panel → Bulk Upload tab
   - Click "Download CSV Template" to get the correct format

3. **Upload CSV**
   - Click "Choose File" and select your CSV
   - Review the file name
   - Click "Upload & Register Teams"

4. **Review Results**
   - View success count (green)
   - View failed count (red) - check error messages
   - View duplicates count (yellow) - teams already exist

5. **Download Credentials**
   - Click "Download Team Credentials" button
   - Save the CSV file with generated passwords
   - Share credentials with respective teams

### CSV Output Format
After successful registration, you'll receive a credentials CSV:
```csv
Team Name,Password,Member Count
Team Alpha,Abc12345,4
Team Beta,Xyz67890,2
```

## Features

- ✅ **Auto-generate passwords**: 8-character random passwords (alphanumeric, no confusing characters)
- ✅ **Duplicate detection**: Skips teams that already exist
- ✅ **Error handling**: Reports failed registrations with reasons
- ✅ **Batch processing**: Register multiple teams at once
- ✅ **Member validation**: Accepts 1-4 members per team
- ✅ **Downloadable credentials**: Get all passwords in one file

## Password Generation
- Length: 8 characters
- Character set: A-Z, a-z, 2-9 (excludes 0, 1, O, I, l for clarity)
- Example passwords: `Abc12345`, `Xyz67890`, `Pqr34567`

## API Endpoint
```
POST /admin/bulk-register
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "csvContent": "Team Name,Member 1 Name,Member 1 Contact,...\nTeam Alpha,John,123..."
}

Response:
{
  "success": [
    {
      "teamName": "Team Alpha",
      "password": "Abc12345",
      "teamId": "abc123",
      "memberCount": 4
    }
  ],
  "failed": [
    {
      "teamName": "Team Invalid",
      "reason": "Error message"
    }
  ],
  "duplicates": [
    {
      "teamName": "Team Existing",
      "reason": "Team name already exists"
    }
  ]
}
```

## Tips

1. **Excel to CSV**: Save your Excel file as "CSV (Comma delimited) (*.csv)"
2. **Quotes**: If team names contain commas, Excel will automatically add quotes
3. **Empty cells**: Leave member fields blank if team has fewer than 4 members
4. **Validation**: The system will skip teams with invalid data
5. **Backup**: Keep a copy of the credentials CSV before sharing

## Troubleshooting

**Issue**: Teams not registering  
**Solution**: Check CSV format matches the template exactly

**Issue**: Duplicate errors  
**Solution**: Those teams already exist in the database

**Issue**: Failed registrations  
**Solution**: Check the error message for each failed team

**Issue**: Cannot download credentials  
**Solution**: Ensure at least one team was successfully registered

## Example Workflow

1. Receive team registrations via Google Forms/Excel
2. Export/format data as CSV with the required columns
3. Upload CSV in admin panel
4. Download credentials file
5. Share passwords with teams via email/WhatsApp
6. Teams use their credentials to login and play

## Security Notes

- Passwords are hashed (bcrypt) before storing in database
- Only admin with valid JWT token can bulk upload
- Plain passwords are only shown once in the credentials download
- Recommend teams change passwords after first login (if you implement that feature)
