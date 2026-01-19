// Script to create users in Supabase Auth
// Run with: npx tsx scripts/sync-users-to-supabase-auth.ts

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

const users = [
    { email: "staff@bki.co.id", password: "password123", name: "Staff User" },
    { email: "manager@bki.co.id", password: "password123", name: "Manager User" },
    { email: "bendahara@bki.co.id", password: "password123", name: "Bendahara User" },
    { email: "sekertaris@bki.co.id", password: "password123", name: "Sekertaris User" },
    { email: "ketua@bki.co.id", password: "password123", name: "Ketua User" },
];

async function createUsers() {
    console.log("Creating users in Supabase Auth...\n");

    for (const user of users) {
        try {
            const { data, error } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true, // Auto-confirm email
                user_metadata: { name: user.name },
            });

            if (error) {
                if (error.message.includes("already been registered")) {
                    console.log(`⚠️  ${user.email} - Already exists`);
                } else {
                    console.log(`❌ ${user.email} - Error: ${error.message}`);
                }
            } else {
                console.log(`✅ ${user.email} - Created successfully`);
            }
        } catch (err) {
            console.error(`❌ ${user.email} - Error:`, err);
        }
    }

    console.log("\nDone!");
}

createUsers();
