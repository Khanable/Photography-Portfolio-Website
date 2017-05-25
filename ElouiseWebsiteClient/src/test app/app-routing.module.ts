import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnimationTestComponent }   from './animation-test.component';

const routes: Routes = [
  { path: '', redirectTo: '/index', pathMatch: 'full' },
  { path: 'index',  component: AnimationTestComponent },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
