SELECT * FROM Groups WHERE name = (SELECT "group" FROM Users WHERE id = $id);