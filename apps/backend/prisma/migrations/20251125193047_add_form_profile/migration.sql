-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "formData" JSONB;

-- CreateTable
CREATE TABLE "form_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "nationality" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "occupation" TEXT,
    "company" TEXT,
    "jobTitle" TEXT,
    "yearsExperience" INTEGER,
    "resume" TEXT,
    "coverLetter" TEXT,
    "linkedInUrl" TEXT,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "education" JSONB,
    "skills" TEXT[],
    "documents" JSONB,
    "socialLinks" JSONB,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_profiles_userId_idx" ON "form_profiles"("userId");

-- CreateIndex
CREATE INDEX "form_profiles_isDefault_idx" ON "form_profiles"("isDefault");

-- AddForeignKey
ALTER TABLE "form_profiles" ADD CONSTRAINT "form_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
