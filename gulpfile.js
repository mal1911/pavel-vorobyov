'use strict';

var gulp = require('gulp');
//var gp = require('gulp-load-plugins')();
var server = require('browser-sync').create();
var del = require('del');
var imageminJpegRecompress = require('imagemin-jpeg-recompress');
var pngquant = require('imagemin-pngquant');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');

var plumber = require('gulp-plumber');
var sourcemap = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var csso = require('gulp-csso');
var rename = require('gulp-rename');
var imagemin = require('gulp-imagemin');
var webp = require('gulp-webp');
var svgstore = require('gulp-svgstore');
var posthtml = require('gulp-posthtml');
var include = require('posthtml-include');

gulp.task('scss', function () {
  return gulp.src('source/sass/style.scss')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(csso())
    .pipe(rename('style.min.css'))
    .pipe(sourcemap.write('.'))
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream());
});


gulp.task('server', function () {
  server.init({
    server: 'build/',
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch('source/sass/**/*.{scss,sass}', gulp.series('scss'));
  gulp.watch('source/img/icon-*.svg', gulp.series('sprite', 'html', 'refresh'));
  gulp.watch('source/img/*.{png,jpg,svg}', gulp.series('copy-images', 'refresh'));
  gulp.watch('source/*.html', gulp.series('html', 'refresh'));
  gulp.watch('source/js/**/*.js', gulp.series('scripts'));
});

gulp.task('refresh', function (done) {
  server.reload();
  done();
});

gulp.task('images', function () {
  return gulp.src('source/img/**/*.{png,jpg,svg}')
    .pipe(imagemin([
      imagemin.jpegtran({progressive: true}),
      imageminJpegRecompress({
        loops: 5,
        min: 65,
        max: 70,
        quality: 'medium'
      }),
      imagemin.optipng({optimizationLevel: 3}),
      pngquant({quality: [0.65, 0.7], speed: 5}),
      imagemin.svgo(),
    ]))
    .pipe(gulp.dest('source/img'));
});

gulp.task('copy-images', function () {
  return gulp.src('source/img/**/*.{jpg,png,svg,webp}')
    .pipe(gulp.dest('build/img'));
});

gulp.task('webp', function () {
  return gulp.src('source/img/**/*.{png,jpg}')
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest('source/img'));
});

gulp.task('sprite', function () {
  return gulp.src('build/img/icon-*.svg')
    .pipe(svgstore({inlineSvg: true}))
    .pipe(rename('sprite_auto.svg'))
    .pipe(gulp.dest('build/img'));
});

gulp.task('html', function () {
  return gulp.src('source/*.html')
    .pipe(posthtml([
      include()
    ]))
    .pipe(gulp.dest('build'));
});

gulp.task('copy-all', function () {
  return gulp.src([
    'source/fonts/**/*.{woff,woff2}',
    //'source/img/**',
    'source//*.ico'
  ], {
    base: 'source'
  })
    .pipe(gulp.dest('build'));
});

gulp.task('copy-js', function () {
  return gulp.src([
    'source/js/**',
  ], {
    base: 'source'
  })
    .pipe(gulp.dest('build'));
});

gulp.task('scripts', function () {
  return gulp.src(['source/js/modules/*.js', 'source/js/*.js'])
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(babel({presets: ['@babel/preset-env']}))
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(rename('main.min.js'))
    .pipe(sourcemaps.write(''))
    .pipe(gulp.dest('build/js'))
    .pipe(server.stream());
});

gulp.task('script-vendor', function () {
  return gulp.src(['source/js/vendor/*.js'])
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(babel({presets: ['@babel/preset-env']}))
    .pipe(concat('vendor.js'))
    .pipe(uglify())
    .pipe(rename('vendor.min.js'))
    .pipe(sourcemaps.write(''))
    .pipe(gulp.dest('build/js'))
    .pipe(server.stream());
});



gulp.task('clean', function () {
  return del('build');
});

gulp.task('build', gulp.series('clean', 'copy-all', 'copy-images', 'script-vendor', 'scripts', 'scss', 'sprite', 'html'));
gulp.task('start', gulp.series('build', 'server'));
