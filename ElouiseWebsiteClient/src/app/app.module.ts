import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppRoutingModule } from './app-routing.module';

import { EntryComponent } from './entry.component';
import { AnimationTestComponent } from './animation-test.component';
import { Category } from './animation-test.component';

@NgModule({
  declarations: [
		EntryComponent,
		AnimationTestComponent,
		Category
  ],
  imports: [
		AppRoutingModule,
    BrowserModule,
		BrowserAnimationsModule,
    FormsModule,
    HttpModule,
  ],
  providers: [],
  bootstrap: [EntryComponent]
})
export class AppModule { }
