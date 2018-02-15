import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { IndexComponent } from './index/index.component';
import { AboutComponent } from './about/about.component';
import { BackgroundComponent } from './background/background.component';

@NgModule({
  declarations: [
		AppComponent,
		IndexComponent,
		AboutComponent,
		BackgroundComponent,
  ],
  imports: [
    BrowserModule,
		BrowserAnimationsModule,
    FormsModule,
    HttpModule,
		AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
