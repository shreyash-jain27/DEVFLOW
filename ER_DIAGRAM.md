# Database Entity-Relationship Diagram

*Note: In VS Code, right-click anywhere in this file and select **"Open Preview"** (or press `Ctrl+Shift+V`) to see this code instantly turn into a visual image/diagram!*

```mermaid
erDiagram
    %% Entities
    USER {
        ObjectId _id PK
        String name
        String email "unique"
        String password "hashed"
        String role "enum: developer/manager/admin"
        Date createdAt
        Date updatedAt
    }

    PROJECT {
        ObjectId _id PK
        String name
        String description
        String status "enum: planning/active/completed"
        ObjectId createdBy FK "Ref: USER"
        Date createdAt
        Date updatedAt
    }

    TASK {
        ObjectId _id PK
        String title
        String description
        String status "enum: todo/in-progress/review/done"
        String priority "enum: low/medium/high/critical"
        Boolean aiGenerated
        Object aiSuggestions "embedded subdocument"
        ObjectId assignedTo FK "Ref: USER"
        ObjectId project FK "Ref: PROJECT"
        ObjectId createdBy FK "Ref: USER"
        Date dueDate
        Date createdAt
        Date updatedAt
    }

    %% Relationships
    USER ||--o{ PROJECT : "creates (createdBy)"
    USER ||--o{ TASK : "is assigned to (assignedTo)"
    USER ||--o{ TASK : "creates (createdBy)"
    PROJECT ||--o{ TASK : "contains (project ID)"
```
