import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { GoalsModule } from './goals/goals.module';
import { TasksModule } from './tasks/tasks.module';
import { CategoriesModule } from './categories/categories.module';
import { AuthModule } from './auth/auth.module';
import { YearPlanModule } from './year-plan/year-plan.module';
import { MonthPlanModule } from './month-plan/month-plan.module';
import { WeekPlanModule } from './week-plan/week-plan.module';
import { OwnershipModule } from './common/ownership/ownership.module';
import { HabitsModule } from './habits/habits.module';

@Module({
  imports: [
    OwnershipModule,
    PrismaModule,
    UsersModule,
    GoalsModule,
    TasksModule,
    CategoriesModule,
    AuthModule,
    YearPlanModule,
    MonthPlanModule,
    WeekPlanModule,
    HabitsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
