import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { CategoryComponent } from './category.component';
import { CategoriesComponent } from './categories.component';
import { ImageComponent } from './image.component';

import { CategoriesService } from './categories.service';

@NgModule({
  declarations: [
		AppComponent,
		CategoryComponent,
		CategoriesComponent,
		ImageComponent,
  ],
  imports: [
		AppRoutingModule,
    BrowserModule,
		BrowserAnimationsModule,
    FormsModule,
    HttpModule,
  ],
  providers: [CategoriesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
