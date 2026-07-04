import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { RecurringTasksModule } from './recurring-tasks/recurring-tasks.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
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
    RecurringTasksModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
