SELECT COUNT(*) as count FROM Tags WHERE $countAll = true OR owner = $user;